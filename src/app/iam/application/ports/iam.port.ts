import type { Observable } from 'rxjs';
import type { User } from '@iam/domain/model/user.entity';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import type { LocalCredential } from '@iam/application/contracts/local-credential';
import type { OwnerSignUp } from '@iam/application/contracts/local-sign-up';
import type { GoogleOwnerRegistration } from '@iam/application/contracts/google-registration';

/**
 * AuthenticationPort is the outbound port used by IAM use cases to authenticate against the backend.
 *
 * Every sign-in is made from the web application, which admits only owner accounts: an account that
 * must use the mobile application fails with AuthenticationError code `ROLE_CHANNEL_MISMATCH` and no
 * token is issued. Definitive backend rejections (any 4xx answer) are reported as AuthenticationError;
 * any other error is transient.
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class AuthenticationPort {
  /**
   * Authenticates a user with a local credential and returns the platform token pair.
   * Fails with AuthenticationError code:
   * - `BAD_CREDENTIALS` for an unknown account, a wrong password or an account without a local password
   *   (not distinguishable by design);
   * - `ROLE_CHANNEL_MISMATCH` when the account must use the mobile application;
   * - `TOO_MANY_REQUESTS` when sign-in is throttled after repeated failures;
   * - `VALIDATION_ERROR` for blank or oversized fields.
   * @param credential - The local credential to verify. The username may also be the profile email.
   */
  abstract signInLocally(credential: LocalCredential): Observable<AuthenticationResult>;

  /**
   * Registers a local owner account. No session is issued: the user signs in afterwards.
   * Fails with AuthenticationError code `VALIDATION_ERROR` (invalid form or password policy),
   * `USER_CONFLICT` (username or email taken) or `PROFILE_CONFLICT` (profile already registered).
   * @param signUp - The owner registration data.
   * @returns An Observable of the registered user.
   */
  abstract signUpOwner(signUp: OwnerSignUp): Observable<User>;

  /**
   * Exchanges a Google credential for a platform token pair. The backend validates the Google ID token.
   * Fails with AuthenticationError code:
   * - `GOOGLE_ACCOUNT_NOT_FOUND` when the Google account is not registered (onboarding is required);
   * - `ACCOUNT_LINK_REQUIRED` when the Google email belongs to a password account (linking is required);
   * - `INVALID_TOKEN` when the Google ID token is rejected;
   * - `ROLE_CHANNEL_MISMATCH` when the account must use the mobile application;
   * - `TOO_MANY_REQUESTS` when sign-in is throttled after repeated failures.
   * @param credential - The Google credential to verify.
   */
  abstract signInWithGoogle(credential: GoogleCredential): Observable<AuthenticationResult>;

  /**
   * Links a Google identity to the existing password account that uses its email, and signs it in.
   * Fails with AuthenticationError code `BAD_CREDENTIALS` (no password account or wrong password),
   * `INVALID_TOKEN`, `ROLE_CHANNEL_MISMATCH` or `TOO_MANY_REQUESTS`.
   * @param credential - The Google credential that was rejected with `ACCOUNT_LINK_REQUIRED`.
   * @param password - The current local password of the existing account.
   */
  abstract linkGoogleAccount(
    credential: GoogleCredential,
    password: string,
  ): Observable<AuthenticationResult>;

  /**
   * Completes the registration of an unregistered Google account as an owner and signs it in.
   * Fails with AuthenticationError code `VALIDATION_ERROR`, `INVALID_TOKEN`, `ROLE_CHANNEL_MISMATCH`
   * (the Google account is registered as a technician), `USER_CONFLICT`, `PROFILE_CONFLICT` or
   * `ACCOUNT_LINK_REQUIRED` (the Google email belongs to a password account).
   * @param credential - The Google credential that was rejected with `GOOGLE_ACCOUNT_NOT_FOUND`.
   * @param registration - The owner onboarding data.
   */
  abstract completeGoogleOwnerRegistration(
    credential: GoogleCredential,
    registration: GoogleOwnerRegistration,
  ): Observable<AuthenticationResult>;

  /**
   * Rotates the platform token pair. The given refresh token is single-use.
   * Fails with AuthenticationError carrying a `REFRESH_TOKEN_*` code; only
   * `REFRESH_TOKEN_RECENTLY_ROTATED` is recoverable.
   * @param refreshToken - The current refresh token.
   */
  abstract refreshSession(refreshToken: string): Observable<AuthenticationResult>;

  /**
   * Revokes the refresh token on the backend. Logout is idempotent.
   * @param refreshToken - The current refresh token.
   */
  abstract logout(refreshToken: string): Observable<void>;

  /**
   * Retrieves the authenticated user. Requires a valid platform access token.
   */
  abstract getCurrentUser(): Observable<User>;
}
