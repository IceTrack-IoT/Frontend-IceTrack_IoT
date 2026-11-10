/**
 * DeviceStatus enum represents the lifecycle status of a monitoring device:
 * - `UNPAIRED`: not linked to any equipment; it has no valid API key.
 * - `PAIRED`: linked to one equipment item with a valid API key.
 * - `REVOKED`: still linked to its equipment, but its API key was invalidated.
 */
export enum DeviceStatus {
  UNPAIRED = 'UNPAIRED',
  PAIRED = 'PAIRED',
  REVOKED = 'REVOKED',
}

/**
 * Checks whether a value is one of the confirmed values of device status.
 * @param value - The value to check.
 * @returns True when the value is a DeviceStatus.
 */
export function isDeviceStatus(value: unknown): value is DeviceStatus {
  return Object.values(DeviceStatus).some((deviceStatus) => deviceStatus === value);
}
