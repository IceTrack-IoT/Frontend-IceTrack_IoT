import { inject, Injectable } from '@angular/core';
import { map, type Observable, tap } from 'rxjs';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { AuthenticationPort } from '@iam/application/ports/iam.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';
import { resolveAccessTokenExpiresAt } from '@iam/application/state/access-token-expiration';
import { type ClientSession, createClientSession } from '@iam/application/state/client-session';

/**
 * Links a Google identity to the existing password account that uses its email, after the backend
 * answered `ACCOUNT_LINK_REQUIRED`, and persists the resulting client session. Neither the Google ID
 * token nor the password is persisted.
 */
@Injectable({
  providedIn: 'root',
})
export class LinkGoogleAccountUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);
  private readonly tokenExpiration = inject(TokenExpirationPort);

  /**
   * @param credential - The Google credential that was rejected with `ACCOUNT_LINK_REQUIRED`.
   * @param password - The current local password of the existing account.
   * @returns An Observable of the authenticated client session.
   */
  execute(credential: GoogleCredential, password: string): Observable<ClientSession> {
    return this.authentication.linkGoogleAccount(credential, password).pipe(
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
