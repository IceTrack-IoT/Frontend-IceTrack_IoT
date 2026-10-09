/**
 * DeviceStatus enum represents the pairing and connectivity states of a monitoring device.
 */
export enum DeviceStatus {
  UNPAIRED = 'UNPAIRED',
  PAIRED = 'PAIRED',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

/**
 * Checks whether a value is one of the confirmed values of device status.
 * @param value - The value to check.
 * @returns True when the value is a DeviceStatus.
 */
export function isDeviceStatus(value: unknown): value is DeviceStatus {
  return Object.values(DeviceStatus).some((deviceStatus) => deviceStatus === value);
}
