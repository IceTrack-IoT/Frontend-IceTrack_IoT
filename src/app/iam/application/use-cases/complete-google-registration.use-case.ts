import { inject, Injectable } from '@angular/core';
import { map, type Observable, tap } from 'rxjs';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import type {
  GoogleOwnerRegistration,
  GoogleTechnicianRegistration,
} from '@iam/application/contracts/google-registration';
import { AuthenticationPort } from '@iam/application/ports/authentication.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';
import { resolveAccessTokenExpiresAt } from '@iam/application/state/access-token-expiration';
import { type ClientSession, createClientSession } from '@iam/application/state/client-session';

/**
 * Completes the registration of a Google account that is not registered yet, as an owner or a
 * technician, and persists the resulting client session. The Google ID token is never persisted.
 */
@Injectable({
  providedIn: 'root',
})
export class CompleteGoogleRegistrationUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);
  private readonly tokenExpiration = inject(TokenExpirationPort);

  /**
   * @param credential - The Google credential that was rejected with `GOOGLE_ACCOUNT_NOT_FOUND`.
   * @param registration - The owner onboarding data.
   * @returns An Observable of the authenticated client session.
   */
  executeAsOwner(
    credential: GoogleCredential,
    registration: GoogleOwnerRegistration,
  ): Observable<ClientSession> {
    return this.establishSession(
      this.authentication.completeGoogleOwnerRegistration(credential, registration),
    );
  }

  /**
   * @param credential - The Google credential that was rejected with `GOOGLE_ACCOUNT_NOT_FOUND`.
   * @param registration - The technician onboarding data.
   * @returns An Observable of the authenticated client session.
   */
  executeAsTechnician(
    credential: GoogleCredential,
    registration: GoogleTechnicianRegistration,
  ): Observable<ClientSession> {
    return this.establishSession(
      this.authentication.completeGoogleTechnicianRegistration(credential, registration),
    );
  }

  private establishSession(result: Observable<AuthenticationResult>): Observable<ClientSession> {
    return result.pipe(
      map((authentication) => {
        const declaredExpiresAt = this.tokenExpiration.readExpiresAt(authentication.accessToken);
        return createClientSession(
          authentication,
          resolveAccessTokenExpiresAt(declaredExpiresAt, Date.now()),
        );
      }),
      tap((session) => {
        this.clientSessionStorage.save(session);
        this.sessionSync.publish('signed-in');
      }),
    );
  }
}
