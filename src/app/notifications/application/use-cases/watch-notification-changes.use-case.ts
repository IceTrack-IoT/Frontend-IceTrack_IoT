import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { NotificationFeedEvent } from '@notifications/application/contracts/notification-feed-event';
import { NotificationFeedPort } from '@notifications/application/ports/notification-feed.port';

/**
 * Starts the live feed of the signed-in owner's new notifications and unread count changes.
 */
@Injectable({
  providedIn: 'root',
})
export class WatchNotificationChangesUseCase {
  private readonly feed = inject(NotificationFeedPort);

  /**
   * @returns An Observable of the feed events; unsubscribing stops the feed.
   */
  execute(): Observable<NotificationFeedEvent> {
    return this.feed.watch();
  }
}
