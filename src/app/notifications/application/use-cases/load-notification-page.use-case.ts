import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import {
  NOTIFICATION_PAGE_MAX_SIZE,
  type NotificationPage,
  type NotificationQuery,
} from '@notifications/application/contracts/notification-page';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';

/**
 * Loads one page of the signed-in user's active inbox, most recent first, optionally only the unread
 * notifications.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadNotificationPageUseCase {
  private readonly notifications = inject(NotificationsPort);

  /**
   * @param query - The page, its size, whether to read only unread notifications, and the filters.
   * @returns An Observable of the page.
   */
  execute(query: NotificationQuery): Observable<NotificationPage> {
    return this.notifications.listNotifications({
      page: Math.max(0, Math.trunc(query.page)),
      size: Math.min(NOTIFICATION_PAGE_MAX_SIZE, Math.max(1, Math.trunc(query.size))),
      unreadOnly: query.unreadOnly,
      filters: query.filters,
    });
  }
}
