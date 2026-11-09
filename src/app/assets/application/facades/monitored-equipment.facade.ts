import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, type Observable, throwError } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { Site } from '@assets/domain/model/site.entity';
import { AssetsError } from '@assets/application/contracts/assets-error';
import { LoadAllEquipmentUseCase } from '@assets/application/use-cases/load-all-equipment.use-case';
import { LoadEquipmentUseCase } from '@assets/application/use-cases/load-equipment.use-case';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import type {
  EquipmentDirectory,
  MonitoredEquipment,
} from '@monitoring/application/contracts/monitored-equipment';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import type { EquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';

/**
 * MonitoredEquipmentFacade implements the EquipmentDirectoryPort of Monitoring and Alerting with the
 * Assets Management use cases. It exposes only the read-only equipment data Monitoring presents: identity,
 * name, site, status, threshold and last known telemetry. Equipment registration, editing, threshold
 * configuration and ownership never leave Assets; the backend scopes every read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class MonitoredEquipmentFacade implements EquipmentDirectoryPort {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);
  private readonly loadAllEquipmentUseCase = inject(LoadAllEquipmentUseCase);
  private readonly loadEquipmentUseCase = inject(LoadEquipmentUseCase);

  listEquipment(): Observable<EquipmentDirectory> {
    return forkJoin({
      sites: this.loadSitesUseCase.execute(),
      equipment: this.loadAllEquipmentUseCase.execute(),
    }).pipe(
      map(({ sites, equipment }) => {
        const siteNames = siteNamesOf(sites);
        return {
          equipment: equipment.map((item) => toMonitoredEquipment(item, siteNames)),
          siteCount: sites.length,
        };
      }),
      catchError(toMonitoringError),
    );
  }

  getEquipment(equipmentId: number): Observable<MonitoredEquipment> {
    return forkJoin({
      sites: this.loadSitesUseCase.execute(),
      equipment: this.loadEquipmentUseCase.execute(equipmentId),
    }).pipe(
      map(({ sites, equipment }) => toMonitoredEquipment(equipment, siteNamesOf(sites))),
      catchError(toMonitoringError),
    );
  }
}

function siteNamesOf(sites: readonly Site[]): ReadonlyMap<number, string> {
  return new Map(sites.map((site) => [site.id, site.name]));
}

function toMonitoredEquipment(
  equipment: Equipment,
  siteNames: ReadonlyMap<number, string>,
): MonitoredEquipment {
  return {
    id: equipment.id,
    name: equipment.name,
    siteId: equipment.site_id,
    siteName: siteNames.get(equipment.site_id) ?? null,
    status: equipment.status,
    minCelsius: equipment.temperature_threshold.min_celsius,
    maxCelsius: equipment.temperature_threshold.max_celsius,
    lastReadingAt: equipment.last_reading_at,
    lastKnownTemperature: equipment.last_known_temperature,
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
