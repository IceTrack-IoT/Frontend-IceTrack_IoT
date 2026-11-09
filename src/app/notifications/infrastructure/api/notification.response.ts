/**
 * NotificationResource is returned by `PUT /notifications/{notificationId}/read` and `.../dismiss`, and is
 * embedded in PagedNotificationResource. Nullable properties are written as `null`; they are typed
 * optional as well so a missing one is read as null.
 */
export interface NotificationResource {
  id: number;
  recipient_user_id: number;
  equipment_id?: number | null;
  device_id?: number | null;
  source_alert_id?: number | null;
  message: string;
  type: string;
  severity: string;
  is_read: boolean;
  read_at?: string | null;
  dismissed_at?: string | null;
}

/**
 * PagedNotificationResource is returned by `GET /notifications`. Its items are named `items`, not
 * `content` as in other paged lists.
 */
export interface PagedNotificationResource {
  items: NotificationResource[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/**
 * UnreadNotificationCountResource is returned by `GET /notifications/unread-count`.
 */
export interface UnreadNotificationCountResource {
  unread_count: number;
}
