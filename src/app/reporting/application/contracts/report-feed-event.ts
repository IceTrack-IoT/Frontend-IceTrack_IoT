/** A report generation status, as the live feed reports it. */
export type ReportFeedStatus = 'GENERATING' | 'COMPLETED' | 'FAILED';

/**
 * An event of the live report feed:
 * - `report-status`: a report of the owner moved to another generation status.
 * - `resync`: some changes may have been missed while the feed was down, so reports in progress must be
 *   read again.
 * - `interrupted`: the feed is down and reconnecting; no change arrives meanwhile.
 * - `restored`: the feed is back and every change missed meanwhile was delivered.
 */
export type ReportFeedEvent =
  | { readonly kind: 'report-status'; readonly reportId: number; readonly status: ReportFeedStatus }
  | { readonly kind: 'resync' }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'restored' };
