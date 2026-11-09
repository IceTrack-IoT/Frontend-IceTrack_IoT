import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Notification } from '@notifications/domain/model/notification.entity';
import type {
  NotificationPage,
  NotificationQuery,
} from '@notifications/application/contracts/notification-page';
import type { NotificationsPort } from '@notifications/application/ports/notifications.port';
import { NotificationAssembler } from '@notifications/infrastructure/api/notification-assembler';
import { NotificationsApiEndpoint } from '@notifications/infrastructure/api/notifications-api-endpoint';
import { mapNotificationsErrors } from '@notifications/infrastructure/api/notifications-error-mapping';

/**
 * NotificationsApi implements the NotificationsPort against the inbox endpoints of Notifications.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationsApi extends BaseApi implements NotificationsPort {
  private readonly endpoint = new NotificationsApiEndpoint(inject(HttpClient));
  private readonly assembler = new NotificationAssembler();

  listNotifications(query: NotificationQuery): Observable<NotificationPage> {
    return this.endpoint.listNotifications(query.page, query.size, query.unreadOnly).pipe(
      mapNotificationsErrors(),
      map((resource) => this.assembler.toNotificationPageFromResource(resource)),
    );
  }

  countUnread(): Observable<number> {
    return this.endpoint.countUnread().pipe(
      mapNotificationsErrors(),
      map((resource) => resource.unread_count),
    );
  }

  markAsRead(notificationId: number): Observable<Notification> {
    return this.endpoint.markAsRead(notificationId).pipe(
      mapNotificationsErrors(),
      map((resource) => this.assembler.toNotificationFromResource(resource)),
    );
  }

  dismiss(notificationId: number): Observable<Notification> {
    return this.endpoint.dismiss(notificationId).pipe(
      mapNotificationsErrors(),
      map((resource) => this.assembler.toNotificationFromResource(resource)),
    );
  }
}
