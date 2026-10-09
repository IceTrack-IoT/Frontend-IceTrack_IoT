/**
 * NotificationSeverity is an enum that represents the severity levels of notifications.
 */
export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Checks whether a value is one of the confirmed notification severities.
 * @param value - The value to check.
 * @returns True when the value is a NotificationSeverity.
 */
export function isNotificationSeverity(value: unknown): value is NotificationSeverity {
  return Object.values(NotificationSeverity).some((severity) => severity === value);
}
