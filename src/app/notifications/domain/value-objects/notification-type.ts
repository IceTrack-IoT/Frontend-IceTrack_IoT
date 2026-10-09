export enum NotificationType {
  MAINTENANCE_REMINDER = 'MAINTENANCE_REMINDER',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  LOW_BATTERY = 'LOW_BATTERY',
  SENSOR_FAILURE = 'SENSOR_FAILURE',
  SERVICE_REQUEST_UPDATE = 'SERVICE_REQUEST_UPDATE',
  OUT_OF_RANGER_TEMPERATURE = 'OUT_OF_RANGER_TEMPERATURE',
}

export function isNotificationType(value: unknown): value is NotificationType {
  return Object.values(NotificationType).some((type) => type === value);
}
