import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import type { BucketedReadings, TelemetryPort } from '@monitoring/application/ports/telemetry.port';
import { MonitoringApiEndpoint } from '@monitoring/infrastructure/api/monitoring-api-endpoint';
import { MonitoringAssembler } from '@monitoring/infrastructure/api/monitoring-assembler';
import { mapMonitoringErrors } from '@monitoring/infrastructure/api/monitoring-error-mapping';

/**
 * TelemetryApi implements the TelemetryPort with `GET /telemetry/equipment/{equipmentId}`, raw or aggregated
 * into buckets.
 */
@Injectable({
  providedIn: 'root',
})
export class TelemetryApi extends BaseApi implements TelemetryPort {
  private readonly endpoint = new MonitoringApiEndpoint(inject(HttpClient));
  private readonly assembler = new MonitoringAssembler();

  getReadingHistory(equipmentId: number, from: Date, to: Date): Observable<SensorReading[]> {
    return this.endpoint.getReadingHistory(equipmentId, from, to).pipe(
      mapMonitoringErrors(),
      map((resources) =>
        resources.map((resource) => this.assembler.toSensorReadingFromResource(resource)),
      ),
    );
  }

  getBucketedHistory(equipmentId: number, from: Date, to: Date): Observable<BucketedReadings> {
    return this.endpoint.getBucketedHistory(equipmentId, from, to).pipe(
      mapMonitoringErrors(),
      map((response) => ({
        buckets: (response.body ?? []).map((resource) =>
          this.assembler.toTelemetryBucketFromResource(resource),
        ),
        bucketSeconds: this.assembler.toBucketSeconds(response.headers.get('X-Telemetry-Bucket')),
      })),
    );
  }
}
