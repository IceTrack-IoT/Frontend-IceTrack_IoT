import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { type AlertStatus, isAlertStatus } from '@monitoring/domain/value-objects/alert-status';
import type {
  MonitoringUpdate,
  StreamConnectivityState,
} from '@monitoring/application/contracts/monitoring-update';
import { toInstant } from '@monitoring/infrastructure/api/monitoring-assembler';

/** The SSE event carrying a reading or an alert status change, discriminated by `type`. */
const TELEMETRY_UPDATE_EVENT = 'telemetry-update';
/** The SSE event carrying a change of the connectivity of a unit. */
const CONNECTIVITY_CHANGED_EVENT = 'connectivity-changed';

/**
 * The SSE events of the owner stream that Monitoring and Alerting interprets. Events owned by other
 * bounded contexts are relayed to them uninterpreted.
 */
export const MONITORING_STREAM_EVENTS: readonly string[] = [
  TELEMETRY_UPDATE_EVENT,
  CONNECTIVITY_CHANGED_EVENT,
];

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
  received_at: string;
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

const CONNECTIVITY_STATES: readonly StreamConnectivityState[] = [
  'REPORTING',
  'SILENT',
  'NEVER_REPORTED',
  'NOT_MONITORED',
];

const isRecord = (value: unknown): value is Untrusted =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isInstant = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  values.some((candidate) => candidate === value);

function isReadingRecorded(data: Untrusted): data is Untrusted & ReadingRecordedStreamResource {
  return (
    data['type'] === 'READING_RECORDED' &&
    typeof data['reading_uid'] === 'string' &&
    ['equipment_id', 'device_id', 'min_temperature', 'max_temperature', 'avg_temperature']
      .concat('humidity', 'sample_count')
      .every((key) => isNumber(data[key])) &&
    isInstant(data['recorded_at']) &&
    isInstant(data['received_at']) &&
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
 * TelemetryStreamAssembler converts the untrusted JSON data of the owner stream events Monitoring owns
 * (readings, alert status changes and connectivity changes) into application updates. Data that does not match the documented resources, or carries an undocumented enumeration
 * value, is ignored.
 */
export class TelemetryStreamAssembler {
  /**
   * Converts the data of a Monitoring event of the owner stream.
   * @param event - The SSE event name.
   * @param data - The parsed event data.
   * @returns The update, or null when the data is not a documented update.
   */
  toMonitoringUpdate(event: string, data: unknown): MonitoringUpdate | null {
    if (!isRecord(data)) {
      return null;
    }
    switch (event) {
      case TELEMETRY_UPDATE_EVENT:
        return toTelemetryUpdate(data);
      case CONNECTIVITY_CHANGED_EVENT:
        return toConnectivityUpdate(data);
      default:
        return null;
    }
  }

  /**
   * Reads the data of the `stream-opened` event: how long the server keeps the stream open, and whether
   * every event after the `last_event_id` sent was replayed.
   * @param data - The parsed event data.
   * @returns The timeout in seconds (null when absent) and whether the replay is complete.
   */
  toStreamOpened(data: unknown): { timeoutSeconds: number | null; replayComplete: boolean } {
    if (!isRecord(data)) {
      return { timeoutSeconds: null, replayComplete: false };
    }
    const timeout = data['timeout_seconds'];
    return {
      timeoutSeconds: isNumber(timeout) && timeout > 0 ? timeout : null,
      replayComplete: data['replay_complete'] === true,
    };
  }
}

function toTelemetryUpdate(data: Untrusted): MonitoringUpdate | null {
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

function toConnectivityUpdate(data: Untrusted): MonitoringUpdate | null {
  const equipmentId = data['equipment_id'];
  const state = data['state'];
  const lastReceivedAt = data['last_received_at'] ?? null;
  const underMaintenance = data['under_maintenance'];
  const changedAt = data['changed_at'];
  if (
    !isNumber(equipmentId) ||
    !isOneOf(CONNECTIVITY_STATES, state) ||
    (lastReceivedAt !== null && !isInstant(lastReceivedAt)) ||
    typeof underMaintenance !== 'boolean' ||
    !isInstant(changedAt)
  ) {
    return null;
  }
  return {
    kind: 'connectivity',
    change: {
      equipmentId,
      state,
      lastReceivedAt: lastReceivedAt === null ? null : toInstant(lastReceivedAt),
      underMaintenance,
      changedAt: toInstant(changedAt),
    },
  };
}
