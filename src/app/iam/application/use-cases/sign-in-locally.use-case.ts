import { inject, Injectable } from '@angular/core';
import { AuthenticationPort } from '@iam/application/ports/iam.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';
import { LocalCredential } from '@iam/application/contracts/local-credential';
import { Observable, tap } from 'rxjs';
import { ClientSession, createClientSession } from '@iam/application/state/client-session';
import { map } from 'rxjs/operators';
import { resolveAccessTokenExpiresAt } from '@iam/application/state/access-token-expiration';

/**
 * Use case for signing in a user with local credentials.
 * It handles the authentication process, session creation, and session synchronization.
 */
@Injectable({
  providedIn: 'root',
})
export class SignInLocallyUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);
  private readonly tokenExpiration = inject(TokenExpirationPort);

  /**
   * Executes the sign-in process with the provided local credentials.
   * @param credential - The local credentials to authenticate the user.
   * @returns An Observable of the authenticated client session.
   */
  execute(credential: LocalCredential): Observable<ClientSession> {
    return this.authentication.signInLocally(credential).pipe(
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
