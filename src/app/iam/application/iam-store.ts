import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, type Observable, tap } from 'rxjs';
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
  private readonly signInWithGoogleUseCase = inject(SignInWithGoogleUseCase);
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

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly errorCodeSignal = signal<AuthenticationErrorCode | null>(null);
  /**
   * The machine-readable code of the last authentication failure, e.g. `GOOGLE_ACCOUNT_NOT_FOUND`.
   */
  readonly errorCode = this.errorCodeSignal.asReadonly();

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
   * Signs in with a Google credential and keeps the resulting client session.
   * @param credential - The Google credential containing the ID token issued by Google.
   */
  signInWithGoogle(credential: GoogleCredential): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.errorCodeSignal.set(null);
    this.signInWithGoogleUseCase
      .execute(credential)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (session) => this.sessionSignal.set(session),
        error: (error: unknown) => {
          this.errorCodeSignal.set(isAuthenticationError(error) ? error.code : null);
          this.errorSignal.set(this.formatError(error, 'Failed to sign in with Google'));
        },
      });
  }

  /**
   * Reloads the authenticated user from the backend.
   */
  loadCurrentUser(): void {
    this.loadCurrentUserUseCase.execute().subscribe({
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
    this.signOutUseCase.execute(refreshToken).subscribe();
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
