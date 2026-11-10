import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import { EquipmentPort } from '@assets/application/ports/equipment.port';

/**
 * Loads one of the owner's equipment items for its detail.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadEquipmentUseCase {
  private readonly port = inject(EquipmentPort);

  /**
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the equipment.
   */
  execute(equipmentId: number): Observable<Equipment> {
    return this.port.getEquipment(equipmentId);
  }
}
