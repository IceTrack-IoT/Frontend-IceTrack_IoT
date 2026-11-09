import type { Observable } from 'rxjs';
import type { EquipmentSummary } from '@assets/application/contracts/equipment-summary';

/**
 * EquipmentDirectoryPort lists the signed-in owner's equipment by id, name and site, for bounded contexts
 * that need to refer to an equipment item without owning equipment data (for example, the equipment a
 * service request is for).
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class EquipmentDirectoryPort {
  /**
   * Lists every equipment item of the signed-in owner.
   * @returns An Observable of the equipment summaries.
   */
  abstract listEquipment(): Observable<EquipmentSummary[]>;
}
