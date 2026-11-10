import type { Observable } from 'rxjs';
import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import type { TelemetryBucket } from '@monitoring/domain/value-objects/telemetry-bucket';

/** Reading batches aggregated into buckets of one width. */
export interface BucketedReadings {
  readonly buckets: TelemetryBucket[];
  /** The width the backend chose, in seconds. */
  readonly bucketSeconds: number;
}

/**
 * TelemetryPort is the outbound port used by Monitoring and Alerting use cases to read the reading history
 * of the owner's equipment.
 *
 * Definitive backend rejections are reported as MonitoringError; any other error is transient. Declared as
 * an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class TelemetryPort {
  /**
   * Lists the reading batches of an equipment item recorded within a period, both ends inclusive.
   * Fails with `NOT_FOUND` when the equipment is not reachable by the owner.
   * @param equipmentId - The identifier of the equipment.
   * @param from - The start of the period.
   * @param to - The end of the period.
   * @returns An Observable of the readings.
   */
  abstract getReadingHistory(
    equipmentId: number,
    from: Date,
    to: Date,
  ): Observable<SensorReading[]>;

  /**
   * Aggregates the reading batches of an equipment item recorded within a period into buckets, the
   * backend choosing the smallest width that keeps the answer short. Empty buckets are omitted.
   * Fails with `NOT_FOUND` when the equipment is not reachable by the owner.
   * @param equipmentId - The identifier of the equipment.
   * @param from - The start of the period.
   * @param to - The end of the period.
   * @returns An Observable of the buckets, oldest first, and their width.
   */
  abstract getBucketedHistory(
    equipmentId: number,
    from: Date,
    to: Date,
  ): Observable<BucketedReadings>;
}
