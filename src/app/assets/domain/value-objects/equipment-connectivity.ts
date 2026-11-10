/**
 * ConnectivityState is whether an equipment item is reporting, as the server judges it on every read.
 *
 * - `REPORTING`: a reading batch arrived within the silence window.
 * - `SILENT`: the last batch arrived longer ago.
 * - `NEVER_REPORTED`: no batch is stored yet.
 * - `NOT_MONITORED`: the item is deactivated.
 */
export enum ConnectivityState {
  REPORTING = 'REPORTING',
  SILENT = 'SILENT',
  NEVER_REPORTED = 'NEVER_REPORTED',
  NOT_MONITORED = 'NOT_MONITORED',
}

/**
 * Checks whether a value is one of the documented connectivity states.
 * @param value - The value to check.
 * @returns True when the value is a ConnectivityState.
 */
export function isConnectivityState(value: unknown): value is ConnectivityState {
  return Object.values(ConnectivityState).some((state) => state === value);
}

/**
 * EquipmentConnectivity is the server's evaluation of whether an equipment item is reporting, made with the
 * rule of the scheduled offline detection and the server clock.
 */
export interface EquipmentConnectivity {
  readonly state: ConnectivityState;
  /** Server arrival time of the latest stored batch; null when the item never reported. */
  readonly last_received_at: Date | null;
  /** How long without a batch makes the item silent, in seconds. */
  readonly silent_after_seconds: number;
  /** When the item became silent; only set while it is `SILENT`. */
  readonly silent_since: Date | null;
  /** A maintenance window covers the evaluation time, so silence is expected. */
  readonly under_maintenance: boolean;
  /** Server time of the evaluation. */
  readonly evaluated_at: Date;
}
