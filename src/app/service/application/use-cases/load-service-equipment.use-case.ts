import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { ServiceEquipmentDirectory } from '@service/application/contracts/service-equipment';
import { ServiceEquipmentDirectoryPort } from '@service/application/ports/service-equipment-directory.port';

const byName = (first: { name: string }, second: { name: string }): number =>
  first.name.localeCompare(second.name);

/**
 * Loads the owner's equipment and sites that service requests refer to, through the narrow read-only
 * directory port that Assets implements.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadServiceEquipmentUseCase {
  private readonly directory = inject(ServiceEquipmentDirectoryPort);

  /**
   * @returns An Observable of the owner's equipment and sites, each sorted by name.
   */
  execute(): Observable<ServiceEquipmentDirectory> {
    return this.directory.loadDirectory().pipe(
      map(({ equipment, sites }) => ({
        equipment: [...equipment].sort(byName),
        sites: [...sites].sort(byName),
      })),
    );
  }
}
