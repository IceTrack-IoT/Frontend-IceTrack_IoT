/**
 * BulkNotificationReadRequest is the body of `PUT /notifications/read`: from 1 to 100 identifiers of
 * notifications to mark as read. Identifiers not addressed to the caller, already read or dismissed are
 * skipped by the backend.
 */
export interface BulkNotificationReadRequest {
  notification_ids: number[];
}
