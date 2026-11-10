import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import type { TelemetryBucket } from '@monitoring/domain/value-objects/telemetry-bucket';

/**
 * A point of a telemetry history: one reading batch, or the aggregate of the batches of one period.
 */
export interface TelemetryPoint {
  /** Identifies the point within its history. */
  readonly key: string;
  /** When the batch was recorded, or the start of the aggregated period. */
  readonly at: Date;
  readonly minTemperature: number;
  readonly maxTemperature: number;
  readonly avgTemperature: number;
  /** The humidity, or null when the aggregated batches carried none. */
  readonly humidity: number | null;
  readonly sampleCount: number;
  readonly underMaintenance: boolean;
}

/**
 * The telemetry history of an equipment item over a period, oldest first. Long periods are aggregated
 * into buckets by the backend; `bucketSeconds` is then their width, and null for raw batches.
 */
export interface TelemetryHistory {
  readonly points: readonly TelemetryPoint[];
  readonly bucketSeconds: number | null;
  /** The latest raw batch known, from the loaded batches or received live. */
  readonly latestReading: SensorReading | null;
}

/**
 * Converts a reading batch to a history point.
 * @param reading - The batch.
 * @returns The point.
 */
export function pointOfReading(reading: SensorReading): TelemetryPoint {
  return {
    key: reading.reading_uid,
    at: reading.recorded_at,
    minTemperature: reading.min_temperature,
    maxTemperature: reading.max_temperature,
    avgTemperature: reading.avg_temperature,
    humidity: reading.humidity,
    sampleCount: reading.sample_count,
    underMaintenance: reading.under_maintenance,
  };
}

/**
 * Converts an aggregated period to a history point.
 * @param bucket - The aggregate.
 * @returns The point.
 */
export function pointOfBucket(bucket: TelemetryBucket): TelemetryPoint {
  return {
    key: bucket.bucket_start.toISOString(),
    at: bucket.bucket_start,
    minTemperature: bucket.min_temperature,
    maxTemperature: bucket.max_temperature,
    avgTemperature: bucket.avg_temperature,
    humidity: bucket.avg_humidity,
    sampleCount: bucket.sample_count,
    underMaintenance: bucket.under_maintenance,
  };
}

/**
 * Adds a live reading batch to a history. Raw histories gain the batch (once); aggregated histories fold
 * it into the bucket of its period, created when missing. Batches older than `from` are left out.
 * @param history - The history, oldest first.
 * @param reading - The live batch.
 * @param from - The start of the period shown.
 * @returns The new history.
 */
export function withLiveReading(
  history: TelemetryHistory,
  reading: SensorReading,
  from: Date,
): TelemetryHistory {
  if (reading.recorded_at.getTime() < from.getTime()) {
    return history;
  }
  const latestReading =
    history.latestReading === null ||
    reading.recorded_at.getTime() > history.latestReading.recorded_at.getTime()
      ? reading
      : history.latestReading;
  if (history.bucketSeconds === null) {
    return {
      ...history,
      points: mergePoints(history.points, [pointOfReading(reading)], from),
      latestReading,
    };
  }
  const width = history.bucketSeconds * 1000;
  const start = new Date(Math.floor(reading.recorded_at.getTime() / width) * width);
  const key = start.toISOString();
  const existing = history.points.find((point) => point.key === key);
  const folded: TelemetryPoint =
    existing === undefined
      ? { ...pointOfReading(reading), key, at: start }
      : foldInto(existing, reading);
  return {
    ...history,
    points: [...history.points.filter((point) => point.key !== key), folded].sort(byTime),
    latestReading,
  };
}

/**
 * Merges two lists of points by key, keeping the first occurrence, from a start time, oldest first.
 * @param base - The points that win.
 * @param extra - The points added when missing.
 * @param from - The start of the period shown.
 * @returns The merged points.
 */
export function mergePoints(
  base: readonly TelemetryPoint[],
  extra: readonly TelemetryPoint[],
  from: Date,
): TelemetryPoint[] {
  const byKey = new Map<string, TelemetryPoint>();
  [...base, ...extra].forEach((point) => {
    if (point.at.getTime() >= from.getTime() && !byKey.has(point.key)) {
      byKey.set(point.key, point);
    }
  });
  return [...byKey.values()].sort(byTime);
}

function foldInto(point: TelemetryPoint, reading: SensorReading): TelemetryPoint {
  const samples = point.sampleCount + reading.sample_count;
  const weighted = (current: number, added: number): number =>
    samples === 0
      ? current
      : (current * point.sampleCount + added * reading.sample_count) / samples;
  return {
    ...point,
    minTemperature: Math.min(point.minTemperature, reading.min_temperature),
    maxTemperature: Math.max(point.maxTemperature, reading.max_temperature),
    avgTemperature: weighted(point.avgTemperature, reading.avg_temperature),
    humidity:
      point.humidity === null ? reading.humidity : weighted(point.humidity, reading.humidity),
    sampleCount: samples,
    underMaintenance: point.underMaintenance || reading.under_maintenance,
  };
}

const byTime = (first: TelemetryPoint, second: TelemetryPoint): number =>
  first.at.getTime() - second.at.getTime();
