import type { Observable } from 'rxjs';
import type { SessionSyncEvent } from '@iam/application/contracts/session-sync-event';

/**
 * SessionSyncPort is the outbound port used to coordinate the client session across browser tabs.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class SessionSyncPort {
  /**
   * Session events published by other tabs of this application.
   */
  abstract readonly events: Observable<SessionSyncEvent>;

  /**
   * Publishes a session event to other tabs. Never carries token values.
   * @param event - The event to publish.
   */
  abstract publish(event: SessionSyncEvent): void;
}
