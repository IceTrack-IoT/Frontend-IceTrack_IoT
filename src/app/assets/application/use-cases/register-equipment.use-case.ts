import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { NewEquipment } from '@assets/application/contracts/equipment-registration';
import { EquipmentPort } from '@assets/application/ports/equipment.port';

/**
 * Registers a refrigeration equipment item at one of the owner's sites, with its threshold and
 * maintenance interval.
 */
@Injectable({
  providedIn: 'root',
})
export class RegisterEquipmentUseCase {
  private readonly port = inject(EquipmentPort);

  /**
   * @param equipment - The data of the new equipment.
   * @returns An Observable of the registered equipment, ACTIVE and disconnected.
   */
  execute(equipment: NewEquipment): Observable<Equipment> {
    return this.port.registerEquipment({
      ...equipment,
      uid: equipment.uid.trim(),
      name: equipment.name.trim(),
    });
  }
}
