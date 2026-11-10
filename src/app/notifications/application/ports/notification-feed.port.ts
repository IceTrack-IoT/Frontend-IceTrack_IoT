import type { Observable } from 'rxjs';
import type { NotificationFeedEvent } from '@notifications/application/contracts/notification-feed-event';

/**
 * NotificationFeedPort delivers, live, the notifications raised for the signed-in owner and the changes of
 * its unread count. It is implemented in this context by parsing the events relayed by the owner stream
 * source port, which Monitoring and Alerting implements over its single stream connection.
 *
 * Subscribing starts the feed and unsubscribing stops it. It completes when live updates can never be
 * received in this session, so the count is then read on demand. Declared as an abstract class so it can
 * be used as an Angular dependency injection token.
 */
export abstract class NotificationFeedPort {
  /**
   * Starts the feed of notification events.
   * @returns An Observable of the feed events.
   */
  abstract watch(): Observable<NotificationFeedEvent>;
}
