import { inject, Injectable } from '@angular/core';
import { catchError, defer, type Observable, of } from 'rxjs';
import { isAuthenticationError } from '@iam/application/contracts/authentication-error';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import type { ClientSession } from '@iam/application/state/client-session';
import { RefreshClientSessionUseCase } from '@iam/application/use-cases/refresh-client-session.use-case';

/**
 * Restores the session at startup through a silent refresh of the persisted token pair.
 */
@Injectable({
  providedIn: 'root',
})
export class RestoreClientSessionUseCase {
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly refreshClientSession = inject(RefreshClientSessionUseCase);

  /**
   * @returns An Observable of the refreshed session; null when nothing is persisted or the backend
   *  definitively rejected the refresh; the persisted session when the refresh failed transiently.
   */
  execute(): Observable<ClientSession | null> {
    return defer(() => {
      if (this.clientSessionStorage.load() === null) {
        return of(null);
      }
      return this.refreshClientSession
        .execute()
        .pipe(
          catchError((error: unknown) =>
            of(isAuthenticationError(error) ? null : this.clientSessionStorage.load()),
          ),
        );
    });
  }
}
