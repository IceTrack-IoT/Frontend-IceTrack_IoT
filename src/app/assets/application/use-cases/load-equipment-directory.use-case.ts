import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { EquipmentDirectoryEntry } from '@assets/application/contracts/equipment-directory-entry';
import { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';

/**
 * Loads the identity of every equipment item of the owner, with its site name, in one read. Used by the
 * facades through which other bounded contexts refer to the owner's equipment.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadEquipmentDirectoryUseCase {
  private readonly port = inject(EquipmentDirectoryPort);

  /**
   * @returns An Observable of the directory entries, sorted by name.
   */
  execute(): Observable<EquipmentDirectoryEntry[]> {
    return this.port.listEquipment();
  }
}
