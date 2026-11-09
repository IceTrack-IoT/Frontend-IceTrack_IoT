import type { Observable } from 'rxjs';
import type { Notification } from '@notifications/domain/model/notification.entity';
import type {
  NotificationPage,
  NotificationQuery,
} from '@notifications/application/contracts/notification-page';

/**
 * NotificationsPort is the outbound port used by Notifications use cases to read the signed-in user's inbox
 * and change the state of its notifications. The backend derives the recipient from the access token, so
 * no other inbox is reachable.
 *
 * Definitive backend rejections are reported as NotificationsError; any other error is transient.
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class NotificationsPort {
  /**
   * Reads one page of the active (not dismissed) inbox, most recent first.
   * Fails with `VALIDATION_ERROR` for a negative page or a size below 1.
   * @param query - The page, its size and whether to read only unread notifications.
   * @returns An Observable of the page.
   */
  abstract listNotifications(query: NotificationQuery): Observable<NotificationPage>;

  /**
   * Counts the notifications that are neither read nor dismissed.
   * @returns An Observable of the count.
   */
  abstract countUnread(): Observable<number>;

  /**
   * Marks a notification as read.
   * Fails with `NOT_FOUND`.
   * @param notificationId - The identifier of the notification.
   * @returns An Observable of the notification, as the backend recorded it.
   */
  abstract markAsRead(notificationId: number): Observable<Notification>;

  /**
   * Dismisses a notification from the active inbox.
   * Fails with `NOT_FOUND`.
   * @param notificationId - The identifier of the notification.
   * @returns An Observable of the notification, as the backend recorded it.
   */
  abstract dismiss(notificationId: number): Observable<Notification>;
}
