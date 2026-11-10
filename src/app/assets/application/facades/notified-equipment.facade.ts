import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { LoadEquipmentDirectoryUseCase } from '@assets/application/use-cases/load-equipment-directory.use-case';
import type { NotifiedEquipment } from '@notifications/application/contracts/notified-equipment';
import type { EquipmentDirectoryPort } from '@notifications/application/ports/equipment-directory.port';

/**
 * NotifiedEquipmentFacade implements the EquipmentDirectoryPort of Notifications with the Assets equipment
 * directory. It exposes only the identifier and name of each equipment item; the backend scopes the read
 * to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class NotifiedEquipmentFacade implements EquipmentDirectoryPort {
  private readonly loadEquipmentDirectoryUseCase = inject(LoadEquipmentDirectoryUseCase);

  listEquipment(): Observable<NotifiedEquipment[]> {
    return this.loadEquipmentDirectoryUseCase
      .execute()
      .pipe(map((entries) => entries.map(({ id, name }) => ({ id, name }))));
  }
}
