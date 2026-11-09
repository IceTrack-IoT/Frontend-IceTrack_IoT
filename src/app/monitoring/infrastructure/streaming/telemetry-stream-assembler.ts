import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { type AlertStatus, isAlertStatus } from '@monitoring/domain/value-objects/alert-status';
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';
import { toInstant } from '@monitoring/infrastructure/api/monitoring-assembler';

/**
 * ReadingRecordedStreamResource is the data of a `telemetry-update` event whose `type` is
 * `READING_RECORDED`. Only the properties the web application reads are declared.
 */
interface ReadingRecordedStreamResource {
  type: 'READING_RECORDED';
  reading_uid: string;
  equipment_id: number;
  device_id: number;
  min_temperature: number;
  max_temperature: number;
  avg_temperature: number;
  humidity: number;
  sample_count: number;
  recorded_at: string;
  under_maintenance: boolean;
}

/**
 * AlertStatusChangedStreamResource is the data of a `telemetry-update` event whose `type` is
 * `ALERT_STATUS_CHANGED`. Only the properties the web application reads are declared.
 */
interface AlertStatusChangedStreamResource {
  type: 'ALERT_STATUS_CHANGED';
  alert_id: number;
  equipment_id: number;
  previous_status: AlertStatus | null;
  status: AlertStatus;
  changed_at: string;
}

type Untrusted = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Untrusted =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isInstant = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

function isReadingRecorded(data: Untrusted): data is Untrusted & ReadingRecordedStreamResource {
  return (
    data['type'] === 'READING_RECORDED' &&
    typeof data['reading_uid'] === 'string' &&
    ['equipment_id', 'device_id', 'min_temperature', 'max_temperature', 'avg_temperature']
      .concat('humidity', 'sample_count')
      .every((key) => isNumber(data[key])) &&
    isInstant(data['recorded_at']) &&
    typeof data['under_maintenance'] === 'boolean'
  );
}

function isAlertStatusChanged(
  data: Untrusted,
): data is Untrusted & AlertStatusChangedStreamResource {
  const previous = data['previous_status'] ?? null;
  return (
    data['type'] === 'ALERT_STATUS_CHANGED' &&
    isNumber(data['alert_id']) &&
    isNumber(data['equipment_id']) &&
    (previous === null || isAlertStatus(previous)) &&
    isAlertStatus(data['status']) &&
    isInstant(data['changed_at'])
  );
}

/**
 * TelemetryStreamAssembler converts the untrusted JSON data of the telemetry stream events into
 * application updates. Data that does not match the documented resources is ignored.
 */
export class TelemetryStreamAssembler {
  /**
   * Converts the data of a `telemetry-update` event.
   * @param data - The parsed event data.
   * @returns The update, or null when the data is not a documented update.
   */
  toMonitoringUpdate(data: unknown): MonitoringUpdate | null {
    if (!isRecord(data)) {
      return null;
    }
    if (isReadingRecorded(data)) {
      return {
        kind: 'reading',
        reading: new SensorReading({
          id: null,
          reading_uid: data.reading_uid,
          equipment_id: data.equipment_id,
          device_id: data.device_id,
          min_temperature: data.min_temperature,
          max_temperature: data.max_temperature,
          avg_temperature: data.avg_temperature,
          humidity: data.humidity,
          sample_count: data.sample_count,
          recorded_at: toInstant(data.recorded_at),
          under_maintenance: data.under_maintenance,
        }),
      };
    }
    if (isAlertStatusChanged(data)) {
      return {
        kind: 'alert-status',
        change: {
          alertId: data.alert_id,
          equipmentId: data.equipment_id,
          previousStatus: data.previous_status ?? null,
          status: data.status,
          changedAt: toInstant(data.changed_at),
        },
      };
    }
    return null;
  }

  /**
   * Reads how long the server keeps the stream open from the data of the `stream-opened` event.
   * @param data - The parsed event data.
   * @returns The timeout in seconds, or null when the data does not carry one.
   */
  toStreamTimeoutSeconds(data: unknown): number | null {
    return isRecord(data) && isNumber(data['timeout_seconds']) && data['timeout_seconds'] > 0
      ? data['timeout_seconds']
      : null;
  }
}
