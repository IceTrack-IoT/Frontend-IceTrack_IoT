/**
 * AlertStatus enum represents the lifecycle states of an alert: OPEN, then optionally ACKNOWLEDGED by the
 * owner, and finally RESOLVED or DISMISSED.
 */
export enum AlertStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

/**
 * Checks whether a value is one of the confirmed values of alert status.
 * @param value - The value to check.
 * @returns True when the value is a AlertStatus.
 */
export function isAlertStatus(value: unknown): value is AlertStatus {
  return Object.values(AlertStatus).some((alertStatus) => alertStatus === value);
}

/**
 * Checks whether an alert in a status is still active, that is, not yet resolved or dismissed.
 * @param status - The status of the alert.
 * @returns True for OPEN and ACKNOWLEDGED.
 */
export function isActiveAlertStatus(status: AlertStatus): boolean {
  return status === AlertStatus.OPEN || status === AlertStatus.ACKNOWLEDGED;
}
