/**
 * DeviceConnectivityState is whether a board is reporting, as the server judges it on every read from the
 * arrival time of its latest batch and the offline window of its paired unit.
 *
 * - `REPORTING`: a batch arrived within the window.
 * - `SILENT`: the latest batch arrived longer ago.
 * - `NEVER_REPORTED`: the board is paired and has not sent a batch yet.
 * - `KEY_REVOKED`: the board's API key is revoked, so it cannot send.
 * - `UNPAIRED`: the board is linked to no unit.
 */
export enum DeviceConnectivityState {
  REPORTING = 'REPORTING',
  SILENT = 'SILENT',
  NEVER_REPORTED = 'NEVER_REPORTED',
  KEY_REVOKED = 'KEY_REVOKED',
  UNPAIRED = 'UNPAIRED',
}

/**
 * Checks whether a value is one of the documented device connectivity states.
 * @param value - The value to check.
 * @returns True when the value is a DeviceConnectivityState.
 */
export function isDeviceConnectivityState(value: unknown): value is DeviceConnectivityState {
  return Object.values(DeviceConnectivityState).some((state) => state === value);
}

/**
 * DeviceConnectivity is the server's evaluation of whether a board is reporting. The web application
 * shows it as received and never evaluates it with the browser clock.
 */
export interface DeviceConnectivity {
  readonly state: DeviceConnectivityState;
  /** How long without a batch makes the board silent, in seconds; null when it is unpaired. */
  readonly silent_after_seconds: number | null;
  /** When the board became silent; only set while it is `SILENT`. */
  readonly silent_since: Date | null;
  /** Server time of the evaluation. */
  readonly evaluated_at: Date;
}
