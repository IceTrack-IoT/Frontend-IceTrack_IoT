import type { Observable } from 'rxjs';
import type { ReportFeedEvent } from '@reporting/application/contracts/report-feed-event';

/**
 * ReportStatusFeedPort delivers, live, the generation status changes of the owner's reports. Monitoring
 * and Alerting relays these events through the owner stream source port; this context parses them.
 *
 * Subscribing starts the feed and unsubscribing stops it. It completes when live updates can never be
 * received in this session, so reports in progress are then read periodically instead. Declared as an
 * abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ReportStatusFeedPort {
  /**
   * Starts the feed of report status changes.
   * @returns An Observable of the feed events.
   */
  abstract watch(): Observable<ReportFeedEvent>;
}
