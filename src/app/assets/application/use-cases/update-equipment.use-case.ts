import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { EquipmentChanges } from '@assets/application/contracts/equipment-registration';
import { EquipmentPort } from '@assets/application/ports/equipment.port';

/**
 * Replaces the name, type and maintenance interval of one of the owner's equipment items. Its telemetry
 * and service history are kept.
 */
@Injectable({
  providedIn: 'root',
})
export class UpdateEquipmentUseCase {
  private readonly port = inject(EquipmentPort);

  /**
   * @param equipmentId - The identifier of the equipment.
   * @param changes - The new values.
   * @returns An Observable of the updated equipment.
   */
  execute(equipmentId: number, changes: EquipmentChanges): Observable<Equipment> {
    return this.port.updateEquipment(equipmentId, { ...changes, name: changes.name.trim() });
  }
}
