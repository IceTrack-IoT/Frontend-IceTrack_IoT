import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';
import { SiteDirectoryPort } from '@assets/application/ports/site-directory.port';
import type { ServiceEquipmentDirectory } from '@service/application/contracts/service-equipment';

const byName = (first: { name: string }, second: { name: string }): number =>
  first.name.localeCompare(second.name);

/**
 * Loads the owner's equipment and sites that service requests refer to, through the narrow read-only
 * directories that Assets offers.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadServiceEquipmentUseCase {
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);
  private readonly siteDirectory = inject(SiteDirectoryPort);

  /**
   * @returns An Observable of the owner's equipment and sites, each sorted by name.
   */
  execute(): Observable<ServiceEquipmentDirectory> {
    return forkJoin({
      equipment: this.equipmentDirectory.listEquipment(),
      sites: this.siteDirectory.listSites(),
    }).pipe(
      map(({ equipment, sites }) => ({
        equipment: equipment.map(({ id, name, siteId }) => ({ id, name, siteId })).sort(byName),
        sites: sites.map(({ id, name }) => ({ id, name })).sort(byName),
      })),
    );
  }
}
