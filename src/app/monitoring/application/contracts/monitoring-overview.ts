import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';

/**
 * The owner's monitoring overview: the equipment with its last known telemetry, the policy that applies
 * to each item, the active (OPEN or ACKNOWLEDGED) alerts, and the counters of other contexts the overview
 * shows.
 */
export interface MonitoringOverview {
  readonly equipment: readonly MonitoredEquipment[];
  readonly siteCount: number;
  /** The applicable alert policy of each equipment item, by equipment id; missing when unreadable. */
  readonly policies: ReadonlyMap<number, AlertPolicy>;
  /** The active alerts of every equipment item, newest first. */
  readonly activeAlerts: readonly Alert[];
  /** The number of the owner's active service requests, or null when it could not be read. */
  readonly activeServiceRequests: number | null;
}

/**
 * The telemetry context of one equipment item: the item, its applicable alert policy and its active
 * alerts.
 */
export interface EquipmentTelemetryContext {
  readonly equipment: MonitoredEquipment;
  /** The applicable alert policy, or null when it could not be read. */
  readonly policy: AlertPolicy | null;
  readonly activeAlerts: readonly Alert[];
}

/**
 * An alert together with the equipment it concerns, when that equipment can still be read.
 */
export interface AlertWithEquipment {
  readonly alert: Alert;
  readonly equipment: MonitoredEquipment | null;
}
