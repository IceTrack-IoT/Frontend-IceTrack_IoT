import { inject, Injectable } from '@angular/core';
import { catchError, defer, type Observable, of } from 'rxjs';
import { AuthenticationPort } from '@iam/application/ports/iam.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';

/**
 * Signs the user out: clears the persisted session first, broadcasts `logout-completed`, then revokes
 * the refresh token on the backend. A failed remote logout never keeps local tokens.
 */
@Injectable({
  providedIn: 'root',
})
export class SignOutUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);

  /**
   * @param refreshToken - The current application refresh token, or null when none is known.
   * @returns An Observable that completes once the remote logout has been attempted.
   */
  execute(refreshToken: string | null): Observable<void> {
    return defer(() => {
      this.clientSessionStorage.clear();
      this.sessionSync.publish('logout-completed');
      return this.authentication.logout(refreshToken).pipe(catchError(() => of(undefined)));
    });
  }
}
