import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import type { AlertStatus } from '@monitoring/domain/value-objects/alert-status';

/**
 * A change of status of one of the owner's alerts, received live. It names the alert but does not carry
 * the whole alert: who acted is read from the backend.
 */
export interface AlertStatusChange {
  readonly alertId: number;
  readonly equipmentId: number;
  /** The status the alert left, or null when the alert was just raised. */
  readonly previousStatus: AlertStatus | null;
  readonly status: AlertStatus;
  readonly changedAt: Date;
}

/** Whether a unit is reporting, as stored by the offline detection and the reading arrivals. */
export type StreamConnectivityState = 'REPORTING' | 'SILENT' | 'NEVER_REPORTED' | 'NOT_MONITORED';

/**
 * A change of the connectivity of one of the owner's units, or a maintenance window opening or closing on
 * it (the state may then stay the same).
 */
export interface ConnectivityChange {
  readonly equipmentId: number;
  readonly state: StreamConnectivityState;
  /** Server arrival time of the unit's latest batch, or null when it never reported. */
  readonly lastReceivedAt: Date | null;
  readonly underMaintenance: boolean;
  readonly changedAt: Date;
}

/**
 * An update of the owner's live monitoring feed:
 * - `connected`: the stream (re)connected. `resumed` is true when every event missed since the last
 *   connection was replayed, so the loaded state is still current; otherwise it must be read again.
 * - `disconnected`: the stream dropped and is reconnecting.
 * - `reading`: a reading batch of one of the owner's units was recorded.
 * - `alert-status`: an alert of one of the owner's units was raised or changed status.
 * - `connectivity`: the connectivity of one of the owner's units changed.
 */
export type MonitoringUpdate =
  | { readonly kind: 'connected'; readonly resumed: boolean }
  | { readonly kind: 'disconnected' }
  | { readonly kind: 'reading'; readonly reading: SensorReading }
  | { readonly kind: 'alert-status'; readonly change: AlertStatusChange }
  | { readonly kind: 'connectivity'; readonly change: ConnectivityChange };
