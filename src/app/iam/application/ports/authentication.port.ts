import type { Observable } from 'rxjs';
import type { User } from '@iam/domain/model/user.entity';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import { LocalCredential } from '@iam/application/contracts/local-credential';

/**
 * AuthenticationPort is the outbound port used by IAM use cases to authenticate against the backend.
 *
 * Definitive backend rejections are reported as AuthenticationError; any other error is transient.
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class AuthenticationPort {
  /**
   * Authenticates a user with a local credential and returns the platform token pair.
   * Fails with AuthenticationError code:
   * - `VALIDATION_ERROR` for blank fields or a wrong username/password (not distinguishable by code);
   * - `USER_NOT_FOUND` when no user matches the username;
   * - `BUSINESS_RULE_VIOLATION` when the account is federated (e.g. Google) and must use that provider.
   * @param credential - The local credential to verify.
   */
  abstract signInLocally(credential: LocalCredential): Observable<AuthenticationResult>;

  /**
   * Exchanges a Google credential for a platform token pair. The backend validates the Google ID token.
   * Fails with AuthenticationError code `GOOGLE_ACCOUNT_NOT_FOUND` when the account is not registered.
   * @param credential - The Google credential to verify.
   */
  abstract signInWithGoogle(credential: GoogleCredential): Observable<AuthenticationResult>;

  /**
   * Rotates the platform token pair. The given refresh token is single-use.
   * @param refreshToken - The current refresh token.
   */
  abstract refreshSession(refreshToken: string): Observable<AuthenticationResult>;

  /**
   * Revokes the refresh token on the backend. Logout is idempotent.
   * @param refreshToken - The current refresh token, or null when none is known.
   */
  abstract logout(refreshToken: string | null): Observable<void>;

  /**
   * Retrieves the authenticated user. Requires a valid platform access token.
   */
  abstract getCurrentUser(): Observable<User>;
}
