import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { LoadAllEquipmentUseCase } from '@assets/application/use-cases/load-all-equipment.use-case';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import type { DeviceEquipment } from '@device/application/contracts/device-equipment';
import type { EquipmentDirectoryPort } from '@device/application/ports/equipment-directory.port';

/**
 * DeviceEquipmentFacade implements the EquipmentDirectoryPort of Device Management with the Assets
 * Management use cases. It exposes only the identity Device Management needs to pair devices and name
 * their equipment: id, name, site, type and status. Equipment registration, editing, threshold
 * configuration and ownership never leave Assets; the backend scopes every read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceEquipmentFacade implements EquipmentDirectoryPort {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);
  private readonly loadAllEquipmentUseCase = inject(LoadAllEquipmentUseCase);

  listEquipment(): Observable<DeviceEquipment[]> {
    return forkJoin({
      sites: this.loadSitesUseCase.execute(),
      equipment: this.loadAllEquipmentUseCase.execute(),
    }).pipe(
      map(({ sites, equipment }) => {
        const siteNames = new Map(sites.map((site) => [site.id, site.name]));
        return equipment.map((item) => ({
          id: item.id,
          name: item.name,
          siteId: item.site_id,
          siteName: siteNames.get(item.site_id) ?? null,
          type: item.equipment_type,
          status: item.status,
        }));
      }),
    );
  }
}
