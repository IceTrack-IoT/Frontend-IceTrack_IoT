import type { Observable } from 'rxjs';
import type { DeviceEquipment } from '@device/application/contracts/device-equipment';

/**
 * EquipmentDirectoryPort gives Device Management the read-only identity of the owner's equipment: id,
 * name, site, type and status. Assets Management owns that data and implements this port with an
 * application facade; it exposes no equipment registration, editing, threshold configuration or ownership
 * behavior. The backend scopes the directory to the signed-in owner.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class EquipmentDirectoryPort {
  /**
   * Lists every equipment item of the signed-in owner.
   * @returns An Observable of the equipment.
   */
  abstract listEquipment(): Observable<DeviceEquipment[]>;
}
