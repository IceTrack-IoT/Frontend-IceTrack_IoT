/**
 * DismissAlertResource is the body of `PUT /alerts/{alertId}/dismiss`: a non-blank reason of up to 500
 * characters and optional evidence of up to 1000.
 */
export interface DismissAlertRequest {
  reason: string;
  evidence: string | null;
}
