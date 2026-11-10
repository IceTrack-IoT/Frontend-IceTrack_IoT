import type { Observable } from 'rxjs';
import type { OwnerStreamSignal } from '@device/application/contracts/owner-stream-signal';

/**
 * OwnerStreamSourcePort gives this context the events it owns on the signed-in owner's event stream.
 * Monitoring and Alerting holds the single stream connection and implements this port with an application
 * facade that only forwards the named event; this context parses and interprets it.
 *
 * The feed completes when the stream can never be opened in this session. Declared as an abstract class so
 * it can be used as an Angular dependency injection token.
 */
export abstract class OwnerStreamSourcePort {
  /**
   * Relays one named event of the owner stream.
   * @param eventName - The event name.
   * @returns An Observable of the signals; unsubscribing stops relaying.
   */
  abstract watch(eventName: string): Observable<OwnerStreamSignal>;
}
