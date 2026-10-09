/**
 * AlertStatus enum represents the lifecycle states of an alert.
 */
export enum AlertStatus {
  OPEN = 'OPEN',
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
