import type { Observable } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import type { EquipmentPage, EquipmentQuery } from '@assets/application/contracts/equipment-page';
import type {
  EquipmentChanges,
  NewEquipment,
} from '@assets/application/contracts/equipment-registration';

/**
 * EquipmentPort is the outbound port used by Assets Management use cases to run the owner's equipment
 * operations of the backend: register, list, read, update, change the threshold and change the status.
 *
 * Definitive backend rejections are reported as AssetsError; any other error is transient. Declared as an
 * abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class EquipmentPort {
  /**
   * Registers an equipment item at one of the owner's sites.
   * Fails with `VALIDATION_ERROR`, `NOT_FOUND` (site not reachable), `EQUIPMENT_CONFLICT` or
   * `DUPLICATE_RESOURCE_CONFLICT` (uid already used).
   * @param equipment - The data of the new equipment.
   * @returns An Observable of the registered equipment.
   */
  abstract registerEquipment(equipment: NewEquipment): Observable<Equipment>;

  /**
   * Lists one page of the owner's equipment matching the filters.
   * Fails with `VALIDATION_ERROR` for an invalid filter or page.
   * @param query - The filters and paging.
   * @returns An Observable of the page.
   */
  abstract listEquipment(query: EquipmentQuery): Observable<EquipmentPage>;

  /**
   * Retrieves one of the owner's equipment items.
   * Fails with `NOT_FOUND` when it does not exist or is not the owner's.
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the equipment.
   */
  abstract getEquipment(equipmentId: number): Observable<Equipment>;

  /**
   * Replaces the name, type and maintenance interval of one of the owner's equipment items, only when it
   * is still at the given version. Fails with `VALIDATION_ERROR`, `NOT_FOUND` or
   * `CONCURRENT_MODIFICATION_CONFLICT` (it changed since that version; nothing is changed).
   * @param equipmentId - The identifier of the equipment.
   * @param version - The version of the equipment the change was made from.
   * @param changes - The new values.
   * @returns An Observable of the updated equipment.
   */
  abstract updateEquipment(
    equipmentId: number,
    version: number,
    changes: EquipmentChanges,
  ): Observable<Equipment>;

  /**
   * Replaces the temperature threshold of one of the owner's equipment items, only when it is still at the
   * given version. Fails with `VALIDATION_ERROR` (a bound outside 0 to 30 °C, or a minimum not below the
   * maximum), `NOT_FOUND` or `CONCURRENT_MODIFICATION_CONFLICT`.
   * @param equipmentId - The identifier of the equipment.
   * @param version - The version of the equipment the change was made from.
   * @param threshold - The new threshold.
   * @returns An Observable of the updated equipment, with its new configuration version.
   */
  abstract changeThreshold(
    equipmentId: number,
    version: number,
    threshold: TemperatureThreshold,
  ): Observable<Equipment>;

  /**
   * Moves one of the owner's equipment items to a new lifecycle status, only when it is still at the given
   * version. Fails with `NOT_FOUND`, `INVALID_STATUS_TRANSITION` or `CONCURRENT_MODIFICATION_CONFLICT`.
   * @param equipmentId - The identifier of the equipment.
   * @param version - The version of the equipment the change was made from.
   * @param status - The status to move to.
   * @returns An Observable of the updated equipment.
   */
  abstract changeStatus(
    equipmentId: number,
    version: number,
    status: StatusEquipment,
  ): Observable<Equipment>;
}
