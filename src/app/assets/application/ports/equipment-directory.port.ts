import type { Observable } from 'rxjs';
import type { EquipmentDirectoryEntry } from '@assets/application/contracts/equipment-directory-entry';

/**
 * EquipmentDirectoryPort reads the signed-in owner's equipment directory: the identity of every equipment
 * item with the name of its site, sorted by name, in one read. Bounded contexts that only refer to equipment
 * (the equipment a device, notification, report or service request is for) consume it through Assets.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class EquipmentDirectoryPort {
  /**
   * Lists every equipment item of the signed-in owner. An unchanged directory may be answered from the
   * last read without transferring it again.
   * @returns An Observable of the directory entries, sorted by name.
   */
  abstract listEquipment(): Observable<EquipmentDirectoryEntry[]>;
}
