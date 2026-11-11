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
   * @param equipment - The equipment as it was read; the change is refused when it changed since.
   * @param status - The status to move to.
   * @returns An Observable of the updated equipment.
   */
  execute(equipment: Equipment, status: StatusEquipment): Observable<Equipment> {
    return this.port.changeStatus(equipment.id, equipment.version, status);
  }
}
