import type { Notification } from '@notifications/domain/model/notification.entity';
import type { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import type { NotificationType } from '@notifications/domain/value-objects/notification-type';

/** The largest page the backend returns; larger sizes are capped. */
export const NOTIFICATION_PAGE_MAX_SIZE = 100;

/** The severities and types that narrow the inbox; an empty list does not narrow it. */
export interface NotificationFilters {
  readonly severities: readonly NotificationSeverity[];
  readonly types: readonly NotificationType[];
}

/** The outcome of marking several notifications as read at once. */
export interface BulkReadResult {
  /** The notifications that changed from unread to read. */
  readonly updatedCount: number;
  /** The unread count afterward. */
  readonly unreadCount: number;
}

/** Which page of the active inbox to read, whether to read only unread notifications, and its filters. */
export interface NotificationQuery {
  /** The zero-based page index. */
  readonly page: number;
  /** The number of notifications per page, from 1 to 100. */
  readonly size: number;
  readonly unreadOnly: boolean;
  readonly filters: NotificationFilters;
}

/** One page of the active (not dismissed) inbox, most recent first. */
export interface NotificationPage {
  readonly items: readonly Notification[];
  /** The zero-based page index. */
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  /** The number of pages the matching notifications span; at least 1. */
  readonly totalPages: number;
}
