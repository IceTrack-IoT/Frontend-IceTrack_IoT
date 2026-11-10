import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import { AssetsError } from '@assets/application/contracts/assets-error';
import { LoadAllEquipmentUseCase } from '@assets/application/use-cases/load-all-equipment.use-case';
import { LoadEquipmentUseCase } from '@assets/application/use-cases/load-equipment.use-case';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import type { EquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';

/**
 * MonitoredEquipmentFacade implements the EquipmentDirectoryPort of Monitoring and Alerting with the
 * Assets Management use cases. It exposes only the read-only equipment data Monitoring presents: identity,
 * name, site, status, threshold, last known telemetry and connectivity. Equipment registration, editing, threshold
 * configuration and ownership never leave Assets; the backend scopes every read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class MonitoredEquipmentFacade implements EquipmentDirectoryPort {
  private readonly loadAllEquipmentUseCase = inject(LoadAllEquipmentUseCase);
  private readonly loadEquipmentUseCase = inject(LoadEquipmentUseCase);

  listEquipment(): Observable<MonitoredEquipment[]> {
    return this.loadAllEquipmentUseCase.execute().pipe(
      map((equipment) => equipment.map(toMonitoredEquipment)),
      catchError(toMonitoringError),
    );
  }

  getEquipment(equipmentId: number): Observable<MonitoredEquipment> {
    return this.loadEquipmentUseCase
      .execute(equipmentId)
      .pipe(map(toMonitoredEquipment), catchError(toMonitoringError));
  }
}

function toMonitoredEquipment(equipment: Equipment): MonitoredEquipment {
  return {
    id: equipment.id,
    name: equipment.name,
    siteId: equipment.site_id,
    siteName: equipment.site_name,
    status: equipment.status,
    minCelsius: equipment.temperature_threshold.min_celsius,
    maxCelsius: equipment.temperature_threshold.max_celsius,
    lastReadingAt: equipment.last_reading_at,
    lastKnownTemperature: equipment.last_known_temperature,
    connectivity: {
      state: equipment.connectivity.state,
      lastReceivedAt: equipment.connectivity.last_received_at,
      silentAfterSeconds: equipment.connectivity.silent_after_seconds,
      underMaintenance: equipment.connectivity.under_maintenance,
      evaluatedAt: equipment.connectivity.evaluated_at,
    },
  };
}

/** Reports a missing or unreachable equipment item to Monitoring without leaking Assets errors. */
function toMonitoringError(error: unknown): Observable<never> {
  if (error instanceof AssetsError) {
    return throwError(
      () =>
        new MonitoringError(
          error.code === 'NOT_FOUND' ? 'NOT_FOUND' : null,
          'Assets Management rejected the equipment read.',
        ),
    );
  }
  return throwError(() => error);
}
