import type { Observable } from 'rxjs';
import type { NotifiedEquipment } from '@notifications/application/contracts/notified-equipment';

/**
 * EquipmentDirectoryPort gives Notifications the names of the owner's equipment, so a notification can
 * name the equipment it concerns. Assets Management owns that data and implements this port with an
 * application facade; nothing else about the equipment crosses the boundary. The backend scopes the
 * directory to the signed-in owner.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class EquipmentDirectoryPort {
  /**
   * Lists the identifier and name of every equipment item of the signed-in owner.
   * @returns An Observable of the equipment.
   */
  abstract listEquipment(): Observable<NotifiedEquipment[]>;
}
