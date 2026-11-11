import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Notification } from '@notifications/domain/model/notification.entity';
import type { BulkReadResult } from '@notifications/application/contracts/notification-page';
import { NotificationsError } from '@notifications/application/contracts/notifications-error';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';

/** The most notifications the backend marks as read in one request. */
export const MAX_NOTIFICATIONS_PER_BULK_READ = 100;

/**
 * Marks several notifications of the signed-in user as read, in one request. Only notifications that can
 * still be marked (unread and not dismissed) are sent; the backend skips any that changed meanwhile.
 */
@Injectable({
  providedIn: 'root',
})
export class MarkNotificationsAsReadUseCase {
  private readonly notifications = inject(NotificationsPort);

  /**
   * @param notifications - The notifications to mark, at most 100.
   * @returns An Observable of how many changed and the unread count afterward.
   */
  execute(notifications: readonly Notification[]): Observable<BulkReadResult> {
    const ids = notifications
      .filter((notification) => notification.canBeMarkedAsRead())
      .map((notification) => notification.id);
    if (ids.length === 0 || ids.length > MAX_NOTIFICATIONS_PER_BULK_READ) {
      return throwError(
        () =>
          new NotificationsError(
            'VALIDATION_ERROR',
            'Between 1 and 100 unread notifications can be marked as read at once.',
          ),
      );
    }
    return this.notifications.markSeveralAsRead(ids);
  }
}
