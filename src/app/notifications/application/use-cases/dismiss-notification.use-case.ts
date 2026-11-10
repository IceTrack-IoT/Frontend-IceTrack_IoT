import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationsError } from '@notifications/application/contracts/notifications-error';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';

/**
 * Dismisses one of the signed-in user's notifications from the active inbox. It is not deleted; it only
 * stops being listed and counted as unread.
 */
@Injectable({
  providedIn: 'root',
})
export class DismissNotificationUseCase {
  private readonly notifications = inject(NotificationsPort);

  /**
   * @param notification - The notification to dismiss.
   * @returns An Observable of the dismissed notification, as the backend recorded it.
   */
  execute(notification: Notification): Observable<Notification> {
    if (!notification.canBeDismissed()) {
      return throwError(
        () => new NotificationsError('VALIDATION_ERROR', 'The notification is already dismissed.'),
      );
    }
    return this.notifications.dismiss(notification.id);
  }
}
