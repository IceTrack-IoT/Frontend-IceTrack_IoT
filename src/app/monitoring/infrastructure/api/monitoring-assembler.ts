import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { isAlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { isAlertStatus } from '@monitoring/domain/value-objects/alert-status';
import { isAlertType } from '@monitoring/domain/value-objects/alert-type';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';
import type { DismissAlertRequest } from '@monitoring/infrastructure/api/monitoring.requests';
import type {
  AlertPolicyResource,
  AlertResource,
  SensorReadingResource,
} from '@monitoring/infrastructure/api/monitoring.response';

/**
 * MonitoringAssembler converts the Monitoring and Alerting resources into domain entities, and application
 * input into request bodies.
 *
 * A resource carrying a value outside the documented enumerations or an unreadable instant is rejected
 * with an error instead of being shown wrongly.
 */
export class MonitoringAssembler {
  /**
   * Converts an AlertResource to an Alert entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Alert entity.
   */
  toAlertFromResource(resource: AlertResource): Alert {
    const { type, severity, status } = resource;
    if (!isAlertType(type) || !isAlertSeverity(severity) || !isAlertStatus(status)) {
      throw new Error('The alert has an unknown type, severity or status.');
    }
    return new Alert({
      id: resource.id,
      equipment_id: resource.equipment_id,
      type,
      severity,
      status,
      triggering_reading_id: resource.triggering_reading_id ?? null,
      triggering_temperature: resource.triggering_temperature ?? null,
      triggering_recorded_at: toOptionalInstant(resource.triggering_recorded_at),
      peak_temperature: resource.peak_temperature ?? null,
      opened_at: toInstant(resource.opened_at),
      acknowledged_by: resource.acknowledged_by ?? null,
      acknowledged_at: toOptionalInstant(resource.acknowledged_at),
      resolved_by: resource.resolved_by ?? null,
      resolved_at: toOptionalInstant(resource.resolved_at),
      dismissed_by: resource.dismissed_by ?? null,
      dismissed_at: toOptionalInstant(resource.dismissed_at),
      dismiss_reason: resource.dismiss_reason ?? null,
      dismiss_evidence: resource.dismiss_evidence ?? null,
      total_duration_seconds: resource.total_duration_seconds ?? null,
    });
  }

  /**
   * Converts an AlertPolicyResource to an AlertPolicy entity.
   * @param resource - The resource to convert.
   * @returns The corresponding AlertPolicy entity.
   */
  toAlertPolicyFromResource(resource: AlertPolicyResource): AlertPolicy {
    return new AlertPolicy({
      id: resource.id,
      equipment_id: resource.equipment_id ?? null,
      sustained_excursion_minutes: resource.sustained_excursion_minutes,
      hysteresis_margin_celsius: resource.hysteresis_margin_celsius,
      missed_sync_windows_for_offline: resource.missed_sync_windows_for_offline,
      active: resource.active,
    });
  }

  /**
   * Converts a SensorReadingResource to a SensorReading entity.
   * @param resource - The resource to convert.
   * @returns The corresponding SensorReading entity.
   */
  toSensorReadingFromResource(resource: SensorReadingResource): SensorReading {
    return new SensorReading({
      id: resource.id,
      reading_uid: resource.reading_uid,
      equipment_id: resource.equipment_id,
      device_id: resource.device_id,
      min_temperature: resource.min_temperature,
      max_temperature: resource.max_temperature,
      avg_temperature: resource.avg_temperature,
      humidity: resource.humidity,
      sample_count: resource.sample_count,
      recorded_at: toInstant(resource.recorded_at),
      under_maintenance: resource.under_maintenance,
    });
  }

  /**
   * Converts an alert dismissal to the dismiss request body.
   * @param dismissal - The reason and optional evidence.
   * @returns The request body.
   */
  toDismissAlertRequest(dismissal: AlertDismissal): DismissAlertRequest {
    return { reason: dismissal.reason, evidence: dismissal.evidence };
  }
}

/**
 * Reads a required ISO-8601 instant.
 * @param value - The instant, in UTC with `Z`.
 * @returns The date.
 */
export function toInstant(value: string): Date {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('The monitoring resource has an unreadable instant.');
  }
  return instant;
}

function toOptionalInstant(value: string | null | undefined): Date | null {
  return value === null || value === undefined ? null : toInstant(value);
}
