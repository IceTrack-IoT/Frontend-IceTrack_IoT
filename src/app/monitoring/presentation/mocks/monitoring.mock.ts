import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';

/**
 * Mocked telemetry, alerts and alert policies of the signed-in owner.
 * TODO: Replace with the monitoring store once the monitoring use cases and telemetry stream exist.
 */

/**
 * An equipment item as monitoring needs it. Monitoring only stores equipment identifiers; the name, site
 * and threshold come from Assets Management, and the device from Device Management.
 */
export interface MonitoredEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteName: string;
  readonly minCelsius: number;
  readonly maxCelsius: number;
  /** The device that reports the telemetry, or null when none is paired. */
  readonly deviceId: number | null;
  /** The last reported temperature, or null when the equipment never reported telemetry. */
  readonly lastTemperature: number | null;
  /** Seconds since the last reading. */
  readonly lastReadingSecondsAgo: number;
}

/** Counters of other contexts shown by the monitoring dashboard. */
export const DASHBOARD_COUNTS = { sites: 5, activeServiceRequests: 4 } as const;

/** Readings are considered stale after this many seconds without telemetry. */
export const STALE_READING_SECONDS = 180;

export const MONITORED_EQUIPMENT: readonly MonitoredEquipment[] = [
  {
    id: 1,
    name: 'Walk-In Freezer #02',
    siteName: 'San Miguel Depot',
    minCelsius: -20,
    maxCelsius: -16,
    deviceId: 4401,
    lastTemperature: -12.1,
    lastReadingSecondsAgo: 6,
  },
  {
    id: 2,
    name: 'Walk-In Freezer #04',
    siteName: 'San Miguel Depot',
    minCelsius: -20,
    maxCelsius: -16,
    deviceId: 4402,
    lastTemperature: -18.4,
    lastReadingSecondsAgo: 8,
  },
  {
    id: 3,
    name: 'Cold Room #02',
    siteName: 'San Miguel Depot',
    minCelsius: 0,
    maxCelsius: 4,
    deviceId: 4403,
    lastTemperature: 1.9,
    lastReadingSecondsAgo: 11,
  },
  {
    id: 4,
    name: 'Display Chiller #05',
    siteName: 'Miraflores Market',
    minCelsius: 1,
    maxCelsius: 5,
    deviceId: 4404,
    lastTemperature: 4.7,
    lastReadingSecondsAgo: 10,
  },
  {
    id: 5,
    name: 'Ice Cream Freezer #09',
    siteName: 'Miraflores Market',
    minCelsius: -25,
    maxCelsius: -18,
    deviceId: 4405,
    lastTemperature: -21.8,
    lastReadingSecondsAgo: 12,
  },
  {
    id: 6,
    name: 'Cold Room #01',
    siteName: 'Callao Logistics Hub',
    minCelsius: 0,
    maxCelsius: 4,
    deviceId: 4406,
    lastTemperature: 2.4,
    lastReadingSecondsAgo: 5,
  },
  {
    id: 7,
    name: 'Cold Room #03',
    siteName: 'Callao Logistics Hub',
    minCelsius: 0,
    maxCelsius: 4,
    deviceId: 4407,
    lastTemperature: 3.3,
    lastReadingSecondsAgo: 47 * 60,
  },
  {
    id: 8,
    name: 'Blast Freezer #07',
    siteName: 'Surco Central Kitchen',
    minCelsius: -35,
    maxCelsius: -28,
    deviceId: 4408,
    lastTemperature: -31.6,
    lastReadingSecondsAgo: 9,
  },
  {
    id: 9,
    name: 'Reach-In Refrigerator #11',
    siteName: 'Surco Central Kitchen',
    minCelsius: 1,
    maxCelsius: 5,
    deviceId: 4409,
    lastTemperature: 3.6,
    lastReadingSecondsAgo: 14,
  },
  {
    id: 10,
    name: 'Prep Line Refrigerator #12',
    siteName: 'Surco Central Kitchen',
    minCelsius: 1,
    maxCelsius: 5,
    deviceId: null,
    lastTemperature: null,
    lastReadingSecondsAgo: 0,
  },
];

const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60_000);

/** A deterministic pseudo-random sequence, so a chart looks the same on every load. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

function reading(
  id: number,
  equipment: MonitoredEquipment,
  deviceId: number,
  average: number,
  spread: number,
  humidity: number,
  recordedAt: Date,
): SensorReading {
  return new SensorReading({
    id,
    equipment_id: equipment.id,
    device_id: deviceId,
    min_temperature: round1(average - spread),
    max_temperature: round1(average + spread),
    average_temperature: round1(average),
    humidity: Math.round(humidity),
    recorded_at: recordedAt,
    received_at: new Date(recordedAt.getTime() + 2_000),
  });
}

/**
 * Creates the latest reading of each equipment item that reported telemetry.
 * @returns The latest readings, one per equipment item.
 */
export function createLatestReadingsMock(): SensorReading[] {
  return MONITORED_EQUIPMENT.flatMap((equipment) =>
    equipment.lastTemperature === null || equipment.deviceId === null
      ? []
      : [
          reading(
            80_000 + equipment.id,
            equipment,
            equipment.deviceId,
            equipment.lastTemperature,
            0.2,
            70 + equipment.id,
            new Date(Date.now() - equipment.lastReadingSecondsAgo * 1000),
          ),
        ],
  );
}

/**
 * Creates the aggregated readings of an equipment item over a period ending now, oldest first. There are
 * no readings after the equipment stopped reporting.
 * @param equipmentId - The equipment identifier.
 * @param durationMinutes - The length of the period.
 * @param intervalMinutes - The aggregation interval of each reading.
 * @returns The readings of the period.
 */
export function createTelemetryMock(
  equipmentId: number,
  durationMinutes: number,
  intervalMinutes: number,
): SensorReading[] {
  const equipment = MONITORED_EQUIPMENT.find((item) => item.id === equipmentId);
  if (!equipment || equipment.lastTemperature === null || equipment.deviceId === null) {
    return [];
  }
  const { lastTemperature, deviceId } = equipment;
  const random = seededRandom(equipmentId * 977 + intervalMinutes);
  const intervalMs = intervalMinutes * 60_000;
  const end = Date.now() - equipment.lastReadingSecondsAgo * 1000;
  const count = Math.floor((durationMinutes * 60_000 - (Date.now() - end)) / intervalMs) + 1;
  const middle = (equipment.minCelsius + equipment.maxCelsius) / 2;
  const amplitude = (equipment.maxCelsius - equipment.minCelsius) / 6;
  // The last readings converge on the last reported temperature over about 25 minutes.
  const approach = Math.max(1, Math.round(25 / intervalMinutes));

  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const wave = Math.sin(index / 3) * amplitude * 0.6;
    let value = middle + wave + (random() - 0.5) * amplitude;
    const fromEnd = count - 1 - index;
    if (fromEnd < approach) {
      const weight = (approach - fromEnd) / approach;
      value = value + (lastTemperature - value) * weight;
    }
    const spread = 0.15 + random() * 0.25 + Math.min(intervalMinutes, 60) / 200;
    return reading(
      90_000 + equipmentId * 1_000 + index,
      equipment,
      deviceId,
      value,
      spread,
      62 + random() * 24,
      new Date(end - fromEnd * intervalMs),
    );
  });
}

/**
 * Creates the mocked alerts of the owner, newest first. Each call returns new instances.
 * @returns The mocked alerts.
 */
export function createAlertsMock(): Alert[] {
  const alert = (
    id: number,
    equipmentId: number,
    type: AlertType,
    severity: AlertSeverity,
    status: AlertStatus,
    peak: number | null,
    duration: number | null,
    openedMinutesAgo: number,
    closedMinutesAgo: number | null,
  ): Alert =>
    new Alert({
      id,
      equipment_id: equipmentId,
      type,
      severity,
      status,
      trigger_reading_id: peak === null ? null : 70_000 + id,
      peak_temperature: peak,
      excursion_duration: duration,
      opened_at: minutesAgo(openedMinutesAgo),
      resolved_at: closedMinutesAgo === null ? null : minutesAgo(closedMinutesAgo),
    });

  const { TEMPERATURE_EXCURSION: EXCURSION, DEVICE_OFFLINE: OFFLINE } = AlertType;
  const { INFO, WARNING, CRITICAL } = AlertSeverity;
  const { OPEN, RESOLVED, DISMISSED } = AlertStatus;
  return [
    alert(1, 1, EXCURSION, CRITICAL, OPEN, -11.9, 15, 14, null),
    alert(2, 4, EXCURSION, WARNING, OPEN, 4.9, 6, 29, null),
    alert(3, 7, OFFLINE, CRITICAL, OPEN, null, null, 44, null),
    alert(4, 9, OFFLINE, INFO, RESOLVED, null, null, 300, 293),
    alert(5, 8, EXCURSION, WARNING, RESOLVED, -26.9, 9, 480, 468),
    alert(6, 5, EXCURSION, WARNING, DISMISSED, -16.4, 4, 1_290, 1_270),
    alert(7, 2, EXCURSION, INFO, RESOLVED, -15.6, 3, 2_900, 2_895),
  ];
}

/**
 * Simulates the backend dismissing an alert: returns a new instance, so views and components that
 * received the previous one render the change.
 * TODO: Replace with the alert returned by the dismiss alert use case.
 * @param alert - The open alert.
 * @returns The dismissed alert.
 */
export function dismissAlertMock(alert: Alert): Alert {
  return new Alert({
    id: alert.id,
    equipment_id: alert.equipment_id,
    type: alert.type,
    severity: alert.severity,
    status: AlertStatus.DISMISSED,
    trigger_reading_id: alert.trigger_reading_id,
    peak_temperature: alert.peak_temperature,
    excursion_duration: alert.excursion_duration,
    opened_at: alert.opened_at,
    resolved_at: new Date(),
  });
}

/**
 * Creates the reading that triggered an excursion alert, or null for alerts without one.
 * @param alert - The alert.
 * @returns The trigger reading of the alert.
 */
export function createTriggerReadingMock(alert: Alert): SensorReading | null {
  const equipment = MONITORED_EQUIPMENT.find((item) => item.id === alert.equipment_id);
  if (
    alert.trigger_reading_id === null ||
    alert.peak_temperature === null ||
    !equipment ||
    equipment.deviceId === null
  ) {
    return null;
  }
  const average = alert.peak_temperature - 0.2;
  return reading(
    alert.trigger_reading_id,
    equipment,
    equipment.deviceId,
    average,
    0.2,
    78,
    alert.opened_at,
  );
}

/**
 * Creates the mocked alert policy of each equipment item.
 * @returns The mocked alert policies.
 */
export function createAlertPoliciesMock(): AlertPolicy[] {
  return MONITORED_EQUIPMENT.map(
    (equipment) =>
      new AlertPolicy({
        id: 500 + equipment.id,
        equipment_id: equipment.id,
        sustained_excursion_minutes: equipment.minCelsius < -10 ? 2 : 5,
        hysteresis_margin_celsius: equipment.minCelsius < -10 ? 1 : 0.5,
        missed_sync_windows_for_offline: 3,
        is_active: equipment.deviceId !== null,
      }),
  );
}
