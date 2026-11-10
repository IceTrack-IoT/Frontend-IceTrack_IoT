import type { Observable } from 'rxjs';
import type { DeviceFeedEvent } from '@device/application/contracts/device-feed-event';

/**
 * DeviceStatusFeedPort delivers, live, the lifecycle changes of the signed-in owner's boards made from any
 * session. It is implemented in this context by parsing the events relayed by the owner stream source
 * port, which Monitoring and Alerting implements over its single stream connection.
 *
 * Subscribing starts the feed and unsubscribing stops it. It completes when live updates can never be
 * received in this session, so the inventory is then only read on demand. Declared as an abstract class so
 * it can be used as an Angular dependency injection token.
 */
export abstract class DeviceStatusFeedPort {
  /**
   * Starts the feed of device lifecycle changes.
   * @returns An Observable of the feed events.
   */
  abstract watch(): Observable<DeviceFeedEvent>;
}
