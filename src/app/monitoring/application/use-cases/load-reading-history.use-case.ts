import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import {
  pointOfBucket,
  pointOfReading,
  type TelemetryHistory,
  type TelemetryPoint,
} from '@monitoring/application/contracts/telemetry-history';
import { TelemetryPort } from '@monitoring/application/ports/telemetry.port';

/** The longest period read as raw batches; longer periods are aggregated by the backend. */
const RAW_HISTORY_MAX_MINUTES = 360;

const byTime = (first: TelemetryPoint, second: TelemetryPoint): number =>
  first.at.getTime() - second.at.getTime();

/**
 * Loads the reading history of one of the owner's equipment items over a period, oldest first: raw
 * batches up to six hours, and buckets aggregated by the backend for longer periods.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadReadingHistoryUseCase {
  private readonly telemetry = inject(TelemetryPort);

  /**
   * @param equipmentId - The identifier of the equipment.
   * @param from - The start of the period.
   * @param to - The end of the period.
   * @returns An Observable of the history.
   */
  execute(equipmentId: number, from: Date, to: Date): Observable<TelemetryHistory> {
    const minutes = (to.getTime() - from.getTime()) / 60_000;
    if (minutes > RAW_HISTORY_MAX_MINUTES) {
      return this.telemetry.getBucketedHistory(equipmentId, from, to).pipe(
        map(({ buckets, bucketSeconds }) => ({
          points: buckets.map(pointOfBucket).sort(byTime),
          bucketSeconds,
          latestReading: null,
        })),
      );
    }
    return this.telemetry.getReadingHistory(equipmentId, from, to).pipe(
      map((readings) => {
        const sorted = [...readings].sort(
          (first, second) => first.recorded_at.getTime() - second.recorded_at.getTime(),
        );
        return {
          points: sorted.map(pointOfReading),
          bucketSeconds: null,
          latestReading: sorted.at(-1) ?? null,
        };
      }),
    );
  }
}
