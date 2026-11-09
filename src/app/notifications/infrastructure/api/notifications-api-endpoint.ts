import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type {
  NotificationResource,
  PagedNotificationResource,
  UnreadNotificationCountResource,
} from '@notifications/infrastructure/api/notification.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/**
 * NotificationsApiEndpoint sends the inbox requests of the `NotificationsController`. The device token
 * routes (`/notifications/device-tokens`) belong to push delivery on mobile and are not called by the web
 * application.
 */
export class NotificationsApiEndpoint {
  private readonly notificationsUrl = `${baseUrl}${environment.iceTrackProviderNotificationsEndpointPath}`;
  private readonly unreadCountUrl = `${baseUrl}${environment.iceTrackProviderUnreadNotificationCountEndpointPath}`;
  private readonly readUrl = `${baseUrl}${environment.iceTrackProviderMarkNotificationAsReadEndpointPath}`;
  private readonly dismissUrl = `${baseUrl}${environment.iceTrackProviderDismissNotificationEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /notifications?page&size&unread_only` */
  listNotifications(
    page: number,
    size: number,
    unreadOnly: boolean,
  ): Observable<PagedNotificationResource> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('unread_only', unreadOnly);
    return this.http.get<PagedNotificationResource>(this.notificationsUrl, { params });
  }

  /** `GET /notifications/unread-count` */
  countUnread(): Observable<UnreadNotificationCountResource> {
    return this.http.get<UnreadNotificationCountResource>(this.unreadCountUrl);
  }

  /** `PUT /notifications/{notificationId}/read` (no body) */
  markAsRead(notificationId: number): Observable<NotificationResource> {
    return this.http.put<NotificationResource>(withId(this.readUrl, notificationId), null);
  }

  /** `PUT /notifications/{notificationId}/dismiss` (no body) */
  dismiss(notificationId: number): Observable<NotificationResource> {
    return this.http.put<NotificationResource>(withId(this.dismissUrl, notificationId), null);
  }
}

function withId(url: string, notificationId: number): string {
  return url.replace('{notificationId}', encodeURIComponent(String(notificationId)));
}
