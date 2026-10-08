import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, finalize, map, type Observable, of, take, tap } from 'rxjs';
import type { User } from '@iam/domain/model/user.entity';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import {
  type AuthenticationErrorCode,
  isAuthenticationError,
} from '@iam/application/contracts/authentication-error';
import type { ClientSession } from '@iam/application/state/client-session';
import { LoadCurrentUserUseCase } from '@iam/application/use-cases/load-current-user.use-case';
import { RefreshClientSessionUseCase } from '@iam/application/use-cases/refresh-client-session.use-case';
import { RestoreClientSessionUseCase } from '@iam/application/use-cases/restore-client-session.use-case';
import { SignInWithGoogleUseCase } from '@iam/application/use-cases/sign-in-with-google.use-case';
import { SignOutUseCase } from '@iam/application/use-cases/sign-out.use-case';
import { SynchronizeClientSessionUseCase } from '@iam/application/use-cases/synchronize-client-session.use-case';
import { LocalCredential } from '@iam/application/contracts/local-credential';
import { SignInLocallyUseCase } from '@iam/application/use-cases/sign-in-locally.use-case';
import type { OwnerSignUp } from '@iam/application/contracts/local-sign-up';
import { SignUpOwnerUseCase } from '@iam/application/use-cases/sign-up-owner.use-case';
import type {
  GoogleOwnerRegistration,
} from '@iam/application/contracts/google-registration';
import { CompleteGoogleRegistrationUseCase } from '@iam/application/use-cases/complete-google-registration.use-case';

/**
 * Iam Store is a service that manages the state of users and session information in the application.
 * It holds signal-based state only and delegates session operations to IAM use cases.
 */
@Injectable({
  providedIn: 'root',
})
export class IamStore {
  private readonly restoreClientSessionUseCase = inject(RestoreClientSessionUseCase);
  private readonly refreshClientSessionUseCase = inject(RefreshClientSessionUseCase);
  private readonly synchronizeClientSessionUseCase = inject(SynchronizeClientSessionUseCase);
  private readonly signInLocallyUseCase = inject(SignInLocallyUseCase);
  private readonly signUpOwnerUseCase = inject(SignUpOwnerUseCase);
  private readonly signInWithGoogleUseCase = inject(SignInWithGoogleUseCase);
  private readonly completeGoogleRegistrationUseCase = inject(CompleteGoogleRegistrationUseCase);
  private readonly loadCurrentUserUseCase = inject(LoadCurrentUserUseCase);
  private readonly signOutUseCase = inject(SignOutUseCase);

  private readonly usersSignal = signal<User[]>([]);
  readonly users = this.usersSignal.asReadonly();

  private readonly sessionSignal = signal<ClientSession | null>(null);
  readonly currentUser = computed(() => this.sessionSignal()?.user ?? null);
  readonly accessToken = computed(() => this.sessionSignal()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);

  private readonly restoringSignal = signal<boolean>(false);
  readonly restoring = this.restoringSignal.asReadonly();
  private readonly restoring$ = toObservable(this.restoringSignal);

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly errorCodeSignal = signal<AuthenticationErrorCode | null>(null);
  /**
   * The machine-readable code of the last authentication failure, e.g. `GOOGLE_ACCOUNT_NOT_FOUND`.
   */
  readonly errorCode = this.errorCodeSignal.asReadonly();

  private readonly registeredUserSignal = signal<User | null>(null);
  /**
   * The user created by the last successful sign-up. Registration does not start a session.
   */
  readonly registeredUser = this.registeredUserSignal.asReadonly();

  /**
   * The Google credential rejected with `GOOGLE_ACCOUNT_NOT_FOUND`. Completing the registration must
   * send its ID token again, so it is kept in memory only (never persisted) until the registration
   * completes, another sign-in starts, or the feedback is cleared.
   */
  private readonly pendingGoogleCredentialSignal = signal<GoogleCredential | null>(null);
  /**
   * True when the last Google sign-in found no account and the Google registration must be completed.
   */
  readonly googleRegistrationRequired = computed(
    () => this.pendingGoogleCredentialSignal() !== null,
  );

  readonly userCount = computed(() => this.users().length);

  constructor() {
    this.synchronizeClientSessionUseCase
      .execute()
      .pipe(takeUntilDestroyed())
      .subscribe((session) => this.sessionSignal.set(session));
  }

  /**
   * Restores the session at startup through a silent refresh.
   */
  restoreSession(): void {
    this.restoringSignal.set(true);
    this.restoreClientSessionUseCase
      .execute()
      .pipe(finalize(() => this.restoringSignal.set(false)))
      .subscribe((session) => this.sessionSignal.set(session));
  }

  /**
   * Emits once no session restoration is in progress: immediately when none is running, otherwise as
   * soon as the running restoration completes.
   * @returns An Observable that emits once and completes.
   */
  whenSessionResolved(): Observable<void> {
    if (!this.restoringSignal()) {
      return of(undefined);
    }
    return this.restoring$.pipe(
      filter((restoring) => !restoring),
      take(1),
      map(() => undefined),
    );
  }

  /**
   * Obtains a usable session after the backend rejected an access token, sharing a single refresh per tab.
   * @param rejectedAccessToken - The access token the backend rejected, or null when none was sent.
   * @returns An Observable of the usable client session.
   */
  refreshSession(rejectedAccessToken: string | null): Observable<ClientSession> {
    return this.refreshClientSessionUseCase
      .executeAfterRejectedAccessToken(rejectedAccessToken)
      .pipe(
        tap({
          next: (session) => this.sessionSignal.set(session),
          error: (error: unknown) => {
            if (isAuthenticationError(error)) {
              this.sessionSignal.set(null);
            }
          },
        }),
      );
  }

  /**
   * Signs in locally with a username and password, and keeps the resulting client session.
   *
   * @param credential - The local credential containing the username and password.
   */
  signInLocally(credential: LocalCredential): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.pendingGoogleCredentialSignal.set(null);
    this.signInLocallyUseCase
      .execute(credential)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => this.sessionSignal.set(session),
        error: (error: unknown) => {
          this.errorCodeSignal.set(isAuthenticationError(error) ? error.code : null);
          this.errorSignal.set(this.formatError(error, 'Failed to sign in locally'));
        },
      });
  }

  /**
   * Registers a local owner account.
   * @param signUp - The owner registration data.
   */
  signUpOwner(signUp: OwnerSignUp): void {
    this.signUp(this.signUpOwnerUseCase.execute(signUp), 'Failed to sign up as owner');
  }

  /**
   * Clears the feedback of the last operation (error, error code, registered user and pending Google
   * registration).
   */
  clearFeedback(): void {
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.registeredUserSignal.set(null);
    this.pendingGoogleCredentialSignal.set(null);
  }

  /**
   * Signs in with a Google credential and keeps the resulting client session. When the Google account
   * is not registered, the credential is kept in memory so the registration can be completed.
   * @param credential - The Google credential containing the ID token issued by Google.
   */
  signInWithGoogle(credential: GoogleCredential): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.pendingGoogleCredentialSignal.set(null);
    this.signInWithGoogleUseCase
      .execute(credential)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => this.sessionSignal.set(session),
        error: (error: unknown) => {
          if (isAuthenticationError(error, 'GOOGLE_ACCOUNT_NOT_FOUND')) {
            this.pendingGoogleCredentialSignal.set(credential);
          }
          this.errorCodeSignal.set(isAuthenticationError(error) ? error.code : null);
          this.errorSignal.set(this.formatError(error, 'Failed to sign in with Google'));
        },
      });
  }

  /**
   * Completes the pending Google registration as an owner and keeps the resulting client session.
   * @param registration - The owner onboarding data.
   */
  completeGoogleOwnerRegistration(registration: GoogleOwnerRegistration): void {
    this.completeGoogleRegistration(
      (credential) =>
        this.completeGoogleRegistrationUseCase.executeAsOwner(credential, registration),
      'Failed to complete the Google registration as owner',
    );
  }

  /**
   * Reloads the authenticated user from the backend.
   */
  loadCurrentUser(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.loadCurrentUserUseCase
      .execute()
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => this.sessionSignal.set(session),
        error: (error: unknown) =>
          this.errorSignal.set(this.formatError(error, 'Failed to load the current user')),
      });
  }

  /**
   * Signs out: discards the in-memory session immediately and revokes the refresh token remotely.
   */
  signOut(): void {
    const refreshToken = this.sessionSignal()?.refreshToken ?? null;
    this.sessionSignal.set(null);
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.pendingGoogleCredentialSignal.set(null);
    this.signOutUseCase.execute(refreshToken).subscribe();
  }

  private completeGoogleRegistration(
    complete: (credential: GoogleCredential) => Observable<ClientSession>,
    fallbackError: string,
  ): void {
    const credential = this.pendingGoogleCredentialSignal();
    if (credential === null) {
      this.errorSignal.set('Sign in with Google before completing the registration.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    complete(credential)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => {
          this.pendingGoogleCredentialSignal.set(null);
          this.sessionSignal.set(session);
        },
        error: (error: unknown) => {
          this.errorCodeSignal.set(isAuthenticationError(error) ? error.code : null);
          this.errorSignal.set(this.formatError(error, fallbackError));
        },
      });
  }

  private signUp(registration: Observable<User>, fallbackError: string): void {
    this.loadingSignal.set(true);
    this.clearFeedback();
    registration.pipe(finalize(() => this.loadingSignal.set(false))).subscribe({
      next: (user) => this.registeredUserSignal.set(user),
      error: (error: unknown) => {
        this.errorCodeSignal.set(isAuthenticationError(error) ? error.code : null);
        this.errorSignal.set(this.formatError(error, fallbackError));
      },
    });
  }

  /**
   * Formats error messages for user-friendly display.
   * @param error - The error object.
   * @param fallback - The fallback error message.
   * @returns A formatted error message.
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
