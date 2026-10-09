/**
 * AlertSeverity enum represents the severity levels of an alert.
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Checks whether a value is one of the confirmed values of alert severity.
 * @param value - The value to check.
 * @returns True when the value is a AlertSeverity.
 */
export function isAlertSeverity(value: unknown): value is AlertSeverity {
  return Object.values(AlertSeverity).some((alertSeverity) => alertSeverity === value);
}
