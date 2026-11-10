import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationsError } from '@notifications/application/contracts/notifications-error';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';

/**
 * Marks one of the signed-in user's unread notifications as read. The backend records when.
 */
@Injectable({
  providedIn: 'root',
})
export class MarkNotificationAsReadUseCase {
  private readonly notifications = inject(NotificationsPort);

  /**
   * @param notification - The notification to mark as read.
   * @returns An Observable of the notification, as the backend recorded it.
   */
  execute(notification: Notification): Observable<Notification> {
    if (!notification.canBeMarkedAsRead()) {
      return throwError(
        () =>
          new NotificationsError(
            'VALIDATION_ERROR',
            'Only an unread, active notification can be marked as read.',
          ),
      );
    }
    return this.notifications.markAsRead(notification.id);
  }
}
