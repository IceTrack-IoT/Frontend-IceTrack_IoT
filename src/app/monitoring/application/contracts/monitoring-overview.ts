import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { DashboardSummary } from '@monitoring/application/contracts/dashboard-summary';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';

/**
 * The owner's monitoring overview: the totals computed by the backend, the equipment with its last known
 * telemetry and connectivity, and the most recently opened active (OPEN or ACKNOWLEDGED) alerts.
 */
export interface MonitoringOverview {
  readonly summary: DashboardSummary;
  readonly equipment: readonly MonitoredEquipment[];
  /** The most recently opened active alerts, newest first; the summary holds their total. */
  readonly activeAlerts: readonly Alert[];
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
