import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  BulkReadResult,
  NotificationFilters,
} from '@notifications/application/contracts/notification-page';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';

/**
 * Marks every unread notification of the signed-in user matching the filters as read, in one request.
 */
@Injectable({
  providedIn: 'root',
})
export class MarkAllNotificationsAsReadUseCase {
  private readonly notifications = inject(NotificationsPort);

  /**
   * @param filters - The severities and types to mark; empty lists mark every unread notification.
   * @returns An Observable of how many changed and the unread count afterward.
   */
  execute(filters: NotificationFilters): Observable<BulkReadResult> {
    return this.notifications.markAllAsRead(filters);
  }
}
