import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable, of, switchMap } from 'rxjs';
import type { Device } from '@device/domain/model/device.entity';
import type { DeviceInventory } from '@device/application/contracts/device-inventory';
import { DevicesPort } from '@device/application/ports/devices.port';
import { EquipmentDirectoryPort } from '@device/application/ports/equipment-directory.port';

/**
 * Loads the owner's equipment (from Assets Management) and the devices linked to each item. The backend
 * lists devices only per equipment item, so the inventory is composed from one request per item.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadDeviceInventoryUseCase {
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);
  private readonly devices = inject(DevicesPort);

  /**
   * @returns An Observable of the inventory.
   */
  execute(): Observable<DeviceInventory> {
    return this.equipmentDirectory
      .listEquipment()
      .pipe(
        switchMap((equipment) =>
          (equipment.length === 0
            ? of<Device[][]>([])
            : forkJoin(equipment.map(({ id }) => this.devices.listDevicesByEquipment(id)))
          ).pipe(map((devices) => ({ equipment, devices: devices.flat() }))),
        ),
      );
  }
}
