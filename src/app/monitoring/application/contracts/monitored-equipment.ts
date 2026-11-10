/** The lifecycle status of an equipment item, as Assets Management reports it. */
export type MonitoredEquipmentStatus = 'ACTIVE' | 'MAINTENANCE' | 'REPAIR' | 'DEACTIVATED';

/** Whether a unit is reporting, as the server judges it. */
export type MonitoredConnectivityState =
  'REPORTING' | 'SILENT' | 'NEVER_REPORTED' | 'NOT_MONITORED';

/**
 * The server's evaluation of whether a unit is reporting. It is shown as the server states it and kept
 * current only by the server's live connectivity changes; it is never re-evaluated with the browser clock.
 * Being under maintenance is a separate fact, not a connectivity state.
 */
export interface MonitoredConnectivity {
  readonly state: MonitoredConnectivityState;
  /** Server arrival time of the latest batch, or null when the unit never reported. */
  readonly lastReceivedAt: Date | null;
  readonly silentAfterSeconds: number;
  /** A maintenance window covers the unit, so silence is expected. */
  readonly underMaintenance: boolean;
  /** Server time of the evaluation. */
  readonly evaluatedAt: Date;
}

/**
 * An equipment item of the signed-in owner as Monitoring and Alerting needs it. Assets Management owns the
 * equipment, its site and its threshold; Monitoring only reads them to present telemetry and alerts.
 *
 * `lastReadingAt` and `lastKnownTemperature` (the average of the latest reading batch, in Celsius) follow
 * the unit's telemetry and are null while it has not reported yet.
 */
export interface MonitoredEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
  readonly siteName: string;
  readonly status: MonitoredEquipmentStatus;
  /** The lowest temperature of the configured threshold, in Celsius. */
  readonly minCelsius: number;
  /** The highest temperature of the configured threshold, in Celsius. */
  readonly maxCelsius: number;
  readonly lastReadingAt: Date | null;
  readonly lastKnownTemperature: number | null;
  readonly connectivity: MonitoredConnectivity;
}
