import { inject, Injectable } from '@angular/core';
import { filter, map, type Observable } from 'rxjs';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { SessionSyncPort } from '@iam/application/ports/session-sync.port';
import type { ClientSession } from '@iam/application/state/client-session';

/**
 * Follows session changes made by other tabs by re-reading the canonical persisted session.
 */
@Injectable({
  providedIn: 'root',
})
export class SynchronizeClientSessionUseCase {
  private readonly clientSessionStorage = inject(SessionStoragePort);
  private readonly sessionSync = inject(SessionSyncPort);

  /**
   * @returns An Observable emitting the newest persisted session (or null) after each change made by
   *  another tab.
   */
  execute(): Observable<ClientSession | null> {
    return this.sessionSync.events.pipe(
      filter((event) => event !== 'refresh-started'),
      map(() => this.clientSessionStorage.load()),
    );
  }
}
