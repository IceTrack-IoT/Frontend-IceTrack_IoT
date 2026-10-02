import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { AuthenticationPort } from '@iam/application/ports/authentication.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import type { ClientSession } from '@iam/application/state/client-session';

/**
 * Loads the authenticated user from the backend and updates the persisted session with it.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadCurrentUserUseCase {
  private readonly authentication = inject(AuthenticationPort);
  private readonly clientSessionStorage = inject(SessionStoragePort);

  /**
   * @returns An Observable of the updated session, or of the persisted session unchanged when it no
   *  longer belongs to the loaded user.
   */
  execute(): Observable<ClientSession | null> {
    return this.authentication.getCurrentUser().pipe(
      map((user) => {
        const stored = this.clientSessionStorage.load();
        if (stored === null || stored.user.id !== user.id) {
          return stored;
        }
        const updated: ClientSession = { ...stored, user };
        this.clientSessionStorage.save(updated);
        return updated;
      }),
    );
  }
}
