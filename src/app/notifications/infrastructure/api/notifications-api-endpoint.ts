import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type {
  BulkReadResultResource,
  NotificationResource,
  PagedNotificationResource,
  UnreadNotificationCountResource,
} from '@notifications/infrastructure/api/notification.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/** The narrowing filters of the inbox, as query parameter values; an empty filter is not sent. */
export interface NotificationFilterParams {
  severities: readonly string[];
  types: readonly string[];
}

/**
 * NotificationsApiEndpoint sends the inbox requests of the `NotificationsController`. The device token
 * routes (`/notifications/device-tokens`) belong to push delivery on mobile and are not called by the web
 * application.
 */
export class NotificationsApiEndpoint {
  private readonly notificationsUrl = `${baseUrl}${environment.iceTrackProviderNotificationsEndpointPath}`;
  private readonly unreadCountUrl = `${baseUrl}${environment.iceTrackProviderUnreadNotificationCountEndpointPath}`;
  private readonly readUrl = `${baseUrl}${environment.iceTrackProviderMarkNotificationAsReadEndpointPath}`;
  private readonly readAllUrl = `${baseUrl}${environment.iceTrackProviderMarkAllNotificationsAsReadEndpointPath}`;
  private readonly dismissUrl = `${baseUrl}${environment.iceTrackProviderDismissNotificationEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /notifications?page&size&unread_only&severity&type` */
  listNotifications(
    page: number,
    size: number,
    unreadOnly: boolean,
    filters: NotificationFilterParams,
  ): Observable<PagedNotificationResource> {
    const params = withFilters(
      new HttpParams().set('page', page).set('size', size).set('unread_only', unreadOnly),
      filters,
    );
    return this.http.get<PagedNotificationResource>(this.notificationsUrl, { params });
  }

  /** `PUT /notifications/read-all?severity&type` (no body): the matching unread notifications. */
  markAllAsRead(filters: NotificationFilterParams): Observable<BulkReadResultResource> {
    return this.http.put<BulkReadResultResource>(this.readAllUrl, null, {
      params: withFilters(new HttpParams(), filters),
    });
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

function withFilters(params: HttpParams, filters: NotificationFilterParams): HttpParams {
  let query = params;
  if (filters.severities.length > 0) {
    query = query.set('severity', filters.severities.join(','));
  }
  if (filters.types.length > 0) {
    query = query.set('type', filters.types.join(','));
  }
  return query;
}

function withId(url: string, notificationId: number): string {
  return url.replace('{notificationId}', encodeURIComponent(String(notificationId)));
}
