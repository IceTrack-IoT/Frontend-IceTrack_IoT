import { inject, Injectable } from '@angular/core';
import { filter, map, merge, type Observable } from 'rxjs';
import type { NotificationFeedEvent } from '@notifications/application/contracts/notification-feed-event';
import type { NotificationFeedPort } from '@notifications/application/ports/notification-feed.port';
import { OwnerStreamSourcePort } from '@notifications/application/ports/owner-stream-source.port';

/** The owner stream event sent when a notification addressed to the owner is stored. */
const NOTIFICATION_CREATED_EVENT = 'notification-created';
/** The owner stream event sent when the unread count of the owner changes. */
const UNREAD_COUNT_CHANGED_EVENT = 'unread-count-changed';

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** Reads the untrusted data of a `notification-created` event. */
function toCreated(data: unknown): NotificationFeedEvent | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const notificationId: unknown = 'notification_id' in data ? data.notification_id : null;
  const unreadCount: unknown = 'unread_count' in data ? data.unread_count : null;
  return typeof notificationId === 'number' && isCount(unreadCount)
    ? { kind: 'created', notificationId, unreadCount }
    : null;
}

/** Reads the untrusted data of an `unread-count-changed` event. */
function toUnreadCount(data: unknown): NotificationFeedEvent | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const unreadCount: unknown = 'unread_count' in data ? data.unread_count : null;
  return isCount(unreadCount) ? { kind: 'unread-count', unreadCount } : null;
}

/**
 * NotificationFeedApi implements the NotificationFeedPort with the `notification-created` and
 * `unread-count-changed` events of the owner event stream, which Monitoring and Alerting relays on its
 * single connection. Payloads that do not match the documented resources are ignored. Both events share
 * the connection, so the state of the stream (a gap, an interruption, a restoration) is reported once.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationFeedApi implements NotificationFeedPort {
  private readonly source = inject(OwnerStreamSourcePort);

  watch(): Observable<NotificationFeedEvent> {
    const created = this.source
      .watch(NOTIFICATION_CREATED_EVENT)
      .pipe(map((signal) => (signal.kind === 'event' ? toCreated(signal.data) : null)));
    const unreadCount = this.source.watch(UNREAD_COUNT_CHANGED_EVENT).pipe(
      map((signal): NotificationFeedEvent | null => {
        switch (signal.kind) {
          case 'gap':
            return { kind: 'resync' };
          case 'interrupted':
          case 'restored':
            return { kind: signal.kind };
          case 'event':
            return toUnreadCount(signal.data);
        }
      }),
    );
    return merge(created, unreadCount).pipe(
      filter((event): event is NotificationFeedEvent => event !== null),
    );
  }
}
