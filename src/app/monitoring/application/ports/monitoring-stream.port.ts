import type { Observable } from 'rxjs';
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';

/**
 * MonitoringStreamPort is the outbound port that delivers the live readings and alert status changes of the
 * signed-in owner's units.
 *
 * Subscribing opens the feed and unsubscribing closes it. The feed reconnects by itself after a drop,
 * emitting `disconnected` and then `connected` again; it only fails, with a MonitoringError, when it can
 * never be opened for this session (for example `ACCESS_DENIED`). Declared as an abstract class so it can be
 * used as an Angular dependency injection token.
 */
export abstract class MonitoringStreamPort {
  /**
   * Opens the owner's live monitoring feed.
   * @returns An Observable of the feed updates.
   */
  abstract watch(): Observable<MonitoringUpdate>;
}
