/**
 * NotificationType enum represents the kind of event that produced a notification.
 */
export enum NotificationType {
  MAINTENANCE_REMINDER = 'MAINTENANCE_REMINDER',
  TEMPERATURE_EXCURSION = 'TEMPERATURE_EXCURSION',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  LOW_BATTERY = 'LOW_BATTERY',
  SENSOR_FAILURE = 'SENSOR_FAILURE',
  SERVICE_REQUEST_UPDATE = 'SERVICE_REQUEST_UPDATE',
  MAINTENANCE_WINDOW = 'MAINTENANCE_WINDOW',
  UNLINKED_MAINTENANCE_WINDOW = 'UNLINKED_MAINTENANCE_WINDOW',
}

/**
 * Checks whether a value is one of the confirmed notification types.
 * @param value - The value to check.
 * @returns True when the value is a NotificationType.
 */
export function isNotificationType(value: unknown): value is NotificationType {
  return Object.values(NotificationType).some((type) => type === value);
}
