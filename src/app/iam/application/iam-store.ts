import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, finalize, map, type Observable, of, take, tap } from 'rxjs';
import type { User } from '@iam/domain/model/user.entity';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import {
  type AuthenticationErrorCode,
  isAuthenticationError,
} from '@iam/application/contracts/authentication-error';
import type { LocalCredential } from '@iam/application/contracts/local-credential';
import type { OwnerSignUp } from '@iam/application/contracts/local-sign-up';
import type { GoogleOwnerRegistration } from '@iam/application/contracts/google-registration';
import type { ClientSession } from '@iam/application/state/client-session';
import { CompleteGoogleRegistrationUseCase } from '@iam/application/use-cases/complete-google-registration.use-case';
import { LinkGoogleAccountUseCase } from '@iam/application/use-cases/link-google-account.use-case';
import { LoadCurrentUserUseCase } from '@iam/application/use-cases/load-current-user.use-case';
import { RefreshClientSessionUseCase } from '@iam/application/use-cases/refresh-client-session.use-case';
import { RestoreClientSessionUseCase } from '@iam/application/use-cases/restore-client-session.use-case';
import { SignInLocallyUseCase } from '@iam/application/use-cases/sign-in-locally.use-case';
import { SignInWithGoogleUseCase } from '@iam/application/use-cases/sign-in-with-google.use-case';
import { SignOutUseCase } from '@iam/application/use-cases/sign-out.use-case';
import { SignUpOwnerUseCase } from '@iam/application/use-cases/sign-up-owner.use-case';
import { SynchronizeClientSessionUseCase } from '@iam/application/use-cases/synchronize-client-session.use-case';

/**
 * The Google onboarding step requested by the backend after a Google sign-in:
 * - `complete-registration`: the Google account is not registered (`GOOGLE_ACCOUNT_NOT_FOUND`);
 * - `link-account`: the Google email belongs to a password account (`ACCOUNT_LINK_REQUIRED`).
 */
type PendingGoogleStep = 'complete-registration' | 'link-account';

interface PendingGoogleCredential {
  readonly credential: GoogleCredential;
  readonly step: PendingGoogleStep;
}

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
  private readonly linkGoogleAccountUseCase = inject(LinkGoogleAccountUseCase);
  private readonly loadCurrentUserUseCase = inject(LoadCurrentUserUseCase);
  private readonly signOutUseCase = inject(SignOutUseCase);

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
  /**
   * A technical description of the last failure, or null. It never contains backend text; views show
   * translated feedback chosen from `errorCode` instead.
   */
  readonly error = this.errorSignal.asReadonly();

  private readonly errorCodeSignal = signal<AuthenticationErrorCode | null>(null);
  /**
   * The machine-readable code of the last authentication failure, e.g. `BAD_CREDENTIALS`.
   */
  readonly errorCode = this.errorCodeSignal.asReadonly();

  private readonly registeredUserSignal = signal<User | null>(null);
  /**
   * The user created by the last successful sign-up. Registration does not start a session.
   */
  readonly registeredUser = this.registeredUserSignal.asReadonly();

  /**
   * The Google credential of a Google sign-in that requires an onboarding step. Completing that step
   * must send its ID token again, so it is kept in memory only (never persisted) until the step
   * completes, the ID token is rejected, another sign-in starts, or the feedback is cleared.
   */
  private readonly pendingGoogleSignal = signal<PendingGoogleCredential | null>(null);
  /**
   * True when the last Google sign-in found no account and the Google registration must be completed.
   */
  readonly googleRegistrationRequired = computed(
    () => this.pendingGoogleSignal()?.step === 'complete-registration',
  );
  /**
   * True when the Google email belongs to a password account that must be linked with its password.
   */
  readonly googleAccountLinkRequired = computed(
    () => this.pendingGoogleSignal()?.step === 'link-account',
  );

  private readonly mobileApplicationRequiredSignal = signal<boolean>(false);
  /**
   * True when the backend rejected the last sign-in with `ROLE_CHANNEL_MISMATCH`: the credentials are
   * valid, but the account is not an owner and must use the mobile application. No session is issued;
   * the flag lives in memory only, until another attempt starts or the feedback is cleared.
   */
  readonly mobileApplicationRequired = this.mobileApplicationRequiredSignal.asReadonly();

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
   * Signs in locally with a username (or profile email) and password, and keeps the resulting client
   * session.
   *
   * @param credential - The local credential containing the username and password.
   */
  signInLocally(credential: LocalCredential): void {
    this.startAttempt();
    this.pendingGoogleSignal.set(null);
    this.signInLocallyUseCase
      .execute(credential)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => this.sessionSignal.set(session),
        error: (error: unknown) => this.fail(error, 'Failed to sign in locally'),
      });
  }

  /**
   * Registers a local owner account.
   * @param signUp - The owner registration data.
   */
  signUpOwner(signUp: OwnerSignUp): void {
    this.clearFeedback();
    this.loadingSignal.set(true);
    this.signUpOwnerUseCase
      .execute(signUp)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (user) => this.registeredUserSignal.set(user),
        error: (error: unknown) => this.fail(error, 'Failed to sign up as owner'),
      });
  }

  /**
   * Clears the feedback of the last operation (error, error code, registered user, pending Google
   * onboarding step and mobile application requirement).
   */
  clearFeedback(): void {
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.registeredUserSignal.set(null);
    this.pendingGoogleSignal.set(null);
    this.mobileApplicationRequiredSignal.set(false);
  }

  /**
   * Signs in with a Google credential and keeps the resulting client session. When the backend requests
   * an onboarding step (registration or account link), the credential is kept in memory for it.
   * @param credential - The Google credential containing the ID token issued by Google.
   */
  signInWithGoogle(credential: GoogleCredential): void {
    this.startAttempt();
    this.pendingGoogleSignal.set(null);
    this.signInWithGoogleUseCase
      .execute(credential)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => this.sessionSignal.set(session),
        error: (error: unknown) => {
          if (isAuthenticationError(error, 'GOOGLE_ACCOUNT_NOT_FOUND')) {
            this.pendingGoogleSignal.set({ credential, step: 'complete-registration' });
          } else if (isAuthenticationError(error, 'ACCOUNT_LINK_REQUIRED')) {
            this.pendingGoogleSignal.set({ credential, step: 'link-account' });
          }
          this.fail(error, 'Failed to sign in with Google');
        },
      });
  }

  /**
   * Completes the pending Google registration as an owner and keeps the resulting client session.
   * @param registration - The owner onboarding data.
   */
  completeGoogleOwnerRegistration(registration: GoogleOwnerRegistration): void {
    const pending = this.pendingGoogleSignal();
    if (pending?.step !== 'complete-registration') {
      this.errorSignal.set('Sign in with Google before completing the registration.');
      return;
    }
    this.continueGoogleOnboarding(
      pending,
      this.completeGoogleRegistrationUseCase.executeAsOwner(pending.credential, registration),
      'Failed to complete the Google registration as owner',
    );
  }

  /**
   * Links the pending Google credential to the existing password account and keeps the resulting
   * client session.
   * @param password - The current local password of the existing account.
   */
  linkGoogleAccount(password: string): void {
    const pending = this.pendingGoogleSignal();
    if (pending?.step !== 'link-account') {
      this.errorSignal.set('Sign in with Google before linking the account.');
      return;
    }
    this.continueGoogleOnboarding(
      pending,
      this.linkGoogleAccountUseCase.execute(pending.credential, password),
      'Failed to link the Google account',
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
    this.pendingGoogleSignal.set(null);
    this.mobileApplicationRequiredSignal.set(false);
    this.signOutUseCase.execute(refreshToken).subscribe();
  }

  /**
   * Runs a Google onboarding step (registration completion or account link) with the pending credential.
   */
  private continueGoogleOnboarding(
    pending: PendingGoogleCredential,
    onboarding: Observable<ClientSession>,
    fallbackError: string,
  ): void {
    this.startAttempt();
    onboarding.pipe(finalize(() => this.loadingSignal.set(false))).subscribe({
      next: (session) => {
        this.pendingGoogleSignal.set(null);
        this.sessionSignal.set(session);
      },
      error: (error: unknown) => {
        this.pendingGoogleSignal.set(this.remainingGoogleOnboarding(pending, error));
        this.fail(error, fallbackError);
      },
    });
  }

  /**
   * Resolves the Google onboarding step that remains after a failed step:
   * - `ACCOUNT_LINK_REQUIRED`: the same credential continues to the account link;
   * - `INVALID_TOKEN` (e.g. the Google ID token expired) or `ROLE_CHANNEL_MISMATCH`: no step can
   *   continue, the user must start over;
   * - anything else: the same step can be retried with the same credential.
   */
  private remainingGoogleOnboarding(
    pending: PendingGoogleCredential,
    error: unknown,
  ): PendingGoogleCredential | null {
    if (isAuthenticationError(error, 'ACCOUNT_LINK_REQUIRED')) {
      return { credential: pending.credential, step: 'link-account' };
    }
    if (
      isAuthenticationError(error, 'INVALID_TOKEN') ||
      isAuthenticationError(error, 'ROLE_CHANNEL_MISMATCH')
    ) {
      return null;
    }
    return pending;
  }

  private startAttempt(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.mobileApplicationRequiredSignal.set(false);
  }

  private fail(error: unknown, fallbackError: string): void {
    const code = isAuthenticationError(error) ? error.code : null;
    this.errorCodeSignal.set(code);
    this.mobileApplicationRequiredSignal.set(code === 'ROLE_CHANNEL_MISMATCH');
    this.errorSignal.set(this.formatError(error, fallbackError));
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
