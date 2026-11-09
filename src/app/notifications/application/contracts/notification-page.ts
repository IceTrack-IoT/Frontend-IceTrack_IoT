import type { Notification } from '@notifications/domain/model/notification.entity';

/** The largest page the backend returns; larger sizes are capped. */
export const NOTIFICATION_PAGE_MAX_SIZE = 100;

/** Which page of the active inbox to read, and whether to read only unread notifications. */
export interface NotificationQuery {
  /** The zero-based page index. */
  readonly page: number;
  /** The number of notifications per page, from 1 to 100. */
  readonly size: number;
  readonly unreadOnly: boolean;
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
