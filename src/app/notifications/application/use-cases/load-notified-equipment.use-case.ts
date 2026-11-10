import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { EquipmentDirectoryPort } from '@notifications/application/ports/equipment-directory.port';

/**
 * Loads the names of the owner's equipment (from Assets Management), so each notification can name the
 * equipment it concerns.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadNotifiedEquipmentUseCase {
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);

  /**
   * @returns An Observable of the equipment names, by equipment id.
   */
  execute(): Observable<ReadonlyMap<number, string>> {
    return this.equipmentDirectory
      .listEquipment()
      .pipe(map((equipment) => new Map(equipment.map(({ id, name }) => [id, name]))));
  }
}
