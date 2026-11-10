import { inject, Injectable } from '@angular/core';
import { forkJoin, type Observable } from 'rxjs';
import type { DeviceInventory } from '@device/application/contracts/device-inventory';
import { DevicesPort } from '@device/application/ports/devices.port';
import { EquipmentDirectoryPort } from '@device/application/ports/equipment-directory.port';

/**
 * Loads the owner's equipment (from Assets Management) and every device linked to it, in two parallel
 * reads.
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
    return forkJoin({
      equipment: this.equipmentDirectory.listEquipment(),
      devices: this.devices.listDevices(),
    });
  }
}
