import type { Observable } from 'rxjs';
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';
import type { OwnerStreamSignal } from '@monitoring/application/contracts/owner-stream-signal';

/**
 * MonitoringStreamPort is the outbound port to the signed-in owner's live event stream. It delivers the
 * readings, alert status changes and connectivity changes Monitoring interprets, and relays any other
 * named event, uninterpreted, to the bounded context that owns it. Every subscriber shares one
 * connection.
 *
 * Subscribing opens the feed and unsubscribing closes it. The feed reconnects by itself after a drop,
 * emitting `disconnected` and then `connected` again, resumed when the missed events were replayed; it
 * only fails, with a MonitoringError, when it can never be opened for this session (for example
 * `ACCESS_DENIED`). Declared as an abstract class so it can be used as an Angular dependency injection
 * token.
 */
export abstract class MonitoringStreamPort {
  /**
   * Opens the owner's live monitoring feed.
   * @returns An Observable of the feed updates.
   */
  abstract watch(): Observable<MonitoringUpdate>;

  /**
   * Relays one named event of the owner stream, on the same connection, without interpreting it.
   * @param eventName - The event name, as the owning context's configuration names it.
   * @returns An Observable of the signals; it completes when the stream can never be opened.
   */
  abstract watchEvent(eventName: string): Observable<OwnerStreamSignal>;
}
