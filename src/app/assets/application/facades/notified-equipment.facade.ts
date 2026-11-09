import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { LoadAllEquipmentUseCase } from '@assets/application/use-cases/load-all-equipment.use-case';
import type { NotifiedEquipment } from '@notifications/application/contracts/notified-equipment';
import type { EquipmentDirectoryPort } from '@notifications/application/ports/equipment-directory.port';

/**
 * NotifiedEquipmentFacade implements the EquipmentDirectoryPort of Notifications with the Assets
 * Management use cases. It exposes only the identifier and name of each equipment item; the backend scopes
 * the read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class NotifiedEquipmentFacade implements EquipmentDirectoryPort {
  private readonly loadAllEquipmentUseCase = inject(LoadAllEquipmentUseCase);

  listEquipment(): Observable<NotifiedEquipment[]> {
    return this.loadAllEquipmentUseCase
      .execute()
      .pipe(map((equipment) => equipment.map(({ id, name }) => ({ id, name }))));
  }
}
