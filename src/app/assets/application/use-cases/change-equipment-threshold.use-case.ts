import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import { EquipmentPort } from '@assets/application/ports/equipment.port';

/**
 * Replaces the temperature threshold of one of the owner's equipment items. The backend validates the
 * band and the edge gateway downloads it on its next poll; the client never evaluates readings against it.
 */
@Injectable({
  providedIn: 'root',
})
export class ChangeEquipmentThresholdUseCase {
  private readonly port = inject(EquipmentPort);

  /**
   * @param equipment - The equipment as it was read; the change is refused when it changed since.
   * @param threshold - The new threshold.
   * @returns An Observable of the updated equipment.
   */
  execute(equipment: Equipment, threshold: TemperatureThreshold): Observable<Equipment> {
    return this.port.changeThreshold(equipment.id, equipment.version, threshold);
  }
}
