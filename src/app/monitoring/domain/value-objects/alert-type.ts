/**
 * AlertType enum represents the conditions that raise an alert.
 */
export enum AlertType {
  TEMPERATURE_EXCURSION = 'TEMPERATURE_EXCURSION',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
}

/**
 * Checks whether a value is one of the confirmed values of alert type.
 * @param value - The value to check.
 * @returns True when the value is a AlertType.
 */
export function isAlertType(value: unknown): value is AlertType {
  return Object.values(AlertType).some((alertType) => alertType === value);
}
