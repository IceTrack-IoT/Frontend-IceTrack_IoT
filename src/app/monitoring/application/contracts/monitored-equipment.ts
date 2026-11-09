/** The lifecycle status of an equipment item, as Assets Management reports it. */
export type MonitoredEquipmentStatus = 'ACTIVE' | 'MAINTENANCE' | 'REPAIR' | 'DEACTIVATED';

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
  /** The name of the site, or null when the site could not be read. */
  readonly siteName: string | null;
  readonly status: MonitoredEquipmentStatus;
  /** The lowest temperature of the configured threshold, in Celsius. */
  readonly minCelsius: number;
  /** The highest temperature of the configured threshold, in Celsius. */
  readonly maxCelsius: number;
  readonly lastReadingAt: Date | null;
  readonly lastKnownTemperature: number | null;
}

/**
 * The signed-in owner's equipment, with the number of sites it is spread over.
 */
export interface EquipmentDirectory {
  readonly equipment: readonly MonitoredEquipment[];
  readonly siteCount: number;
}
