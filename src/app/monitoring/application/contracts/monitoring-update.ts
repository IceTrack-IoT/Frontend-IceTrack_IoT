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

/**
 * An update of the owner's live monitoring feed:
 * - `connected`: the feed (re)connected. It carries no replay, so the loaded state must be read again.
 * - `disconnected`: the feed dropped and is reconnecting.
 * - `reading`: a reading batch of one of the owner's units was recorded.
 * - `alert-status`: an alert of one of the owner's units was raised or changed status.
 */
export type MonitoringUpdate =
  | { readonly kind: 'connected' }
  | { readonly kind: 'disconnected' }
  | { readonly kind: 'reading'; readonly reading: SensorReading }
  | { readonly kind: 'alert-status'; readonly change: AlertStatusChange };
