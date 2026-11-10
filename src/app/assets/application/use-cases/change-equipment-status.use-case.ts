import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import { EquipmentPort } from '@assets/application/ports/equipment.port';

/**
 * Moves one of the owner's equipment items to a new lifecycle status. The backend enforces the allowed
 * transitions.
 */
@Injectable({
  providedIn: 'root',
})
export class ChangeEquipmentStatusUseCase {
  private readonly port = inject(EquipmentPort);

  /**
   * @param equipmentId - The identifier of the equipment.
   * @param status - The status to move to.
   * @returns An Observable of the updated equipment.
   */
  execute(equipmentId: number, status: StatusEquipment): Observable<Equipment> {
    return this.port.changeStatus(equipmentId, status);
  }
}
