import { inject, Injectable } from '@angular/core';
import { map, type Observable, tap } from 'rxjs';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { AuthenticationPort } from '@iam/application/ports/authentication.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';
import { resolveAccessTokenExpiresAt } from '@iam/application/state/access-token-expiration';
import { type ClientSession, createClientSession } from '@iam/application/state/client-session';

/**
 * Authenticates a user with a Google credential and persists the resulting client session.
 *
 * The Google ID token is only forwarded to the backend and is never persisted. An unregistered account
 * fails with AuthenticationError code `GOOGLE_ACCOUNT_NOT_FOUND`; onboarding is decided by Presentation.
 */
@Injectable({
  providedIn: 'root',
})
export class SignInWithGoogleUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);
  private readonly tokenExpiration = inject(TokenExpirationPort);

  /**
   * @param credential - The Google credential to verify with the backend.
   * @returns An Observable of the authenticated client session.
   */
  execute(credential: GoogleCredential): Observable<ClientSession> {
    return this.authentication.signInWithGoogle(credential).pipe(
      map((result) => {
        const declaredExpiresAt = this.tokenExpiration.readExpiresAt(result.accessToken);
        return createClientSession(
          result,
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
