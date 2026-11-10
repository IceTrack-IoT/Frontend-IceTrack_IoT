/**
 * An event of the live notification feed:
 * - `created`: a notification addressed to the user was stored; `unreadCount` is the count after it.
 * - `unread-count`: the unread count changed, after notifications were raised, read or dismissed.
 * - `resync`: some events may have been missed while the feed was down, so the count and the inbox must
 *   be read again.
 * - `interrupted`: the feed is down and reconnecting; the count is no longer kept current meanwhile.
 * - `restored`: the feed is back and every event missed meanwhile was delivered.
 */
export type NotificationFeedEvent =
  | { readonly kind: 'created'; readonly notificationId: number; readonly unreadCount: number }
  | { readonly kind: 'unread-count'; readonly unreadCount: number }
  | { readonly kind: 'resync' }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'restored' };
