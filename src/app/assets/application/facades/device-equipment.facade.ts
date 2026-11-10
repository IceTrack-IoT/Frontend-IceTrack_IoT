import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { LoadEquipmentDirectoryUseCase } from '@assets/application/use-cases/load-equipment-directory.use-case';
import type { DeviceEquipment } from '@device/application/contracts/device-equipment';
import type { EquipmentDirectoryPort } from '@device/application/ports/equipment-directory.port';

/**
 * DeviceEquipmentFacade implements the EquipmentDirectoryPort of Device Management with the Assets
 * equipment directory. It exposes only the identity Device Management needs to pair devices and name
 * their equipment: id, name, site, type and status. Equipment registration, editing, threshold
 * configuration and ownership never leave Assets; the backend scopes every read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceEquipmentFacade implements EquipmentDirectoryPort {
  private readonly loadEquipmentDirectoryUseCase = inject(LoadEquipmentDirectoryUseCase);

  listEquipment(): Observable<DeviceEquipment[]> {
    return this.loadEquipmentDirectoryUseCase.execute().pipe(
      map((entries) =>
        entries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          siteId: entry.siteId,
          siteName: entry.siteName,
          type: entry.type,
          status: entry.status,
        })),
      ),
    );
  }
}
