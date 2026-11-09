import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { TelemetryPort } from '@monitoring/application/ports/telemetry.port';

/**
 * Loads the reading history of one of the owner's equipment items over a period, oldest first.
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
   * @returns An Observable of the readings, oldest first.
   */
  execute(equipmentId: number, from: Date, to: Date): Observable<SensorReading[]> {
    return this.telemetry
      .getReadingHistory(equipmentId, from, to)
      .pipe(
        map((readings) =>
          [...readings].sort(
            (first, second) => first.recorded_at.getTime() - second.recorded_at.getTime(),
          ),
        ),
      );
  }
}
