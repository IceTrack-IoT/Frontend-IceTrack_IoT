import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { LoadEquipmentDirectoryUseCase } from '@assets/application/use-cases/load-equipment-directory.use-case';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import type { ServiceEquipmentDirectory } from '@service/application/contracts/service-equipment';
import type { ServiceEquipmentDirectoryPort } from '@service/application/ports/service-equipment-directory.port';

/**
 * ServiceEquipmentFacade implements the ServiceEquipmentDirectoryPort of Service Request Management with
 * the Assets site list and equipment directory. It exposes only the identifier, name and site of each
 * equipment item and the identifier and name of each site; the backend scopes every read to the signed-in
 * owner. Sites are read on their own so a site without equipment is still known.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceEquipmentFacade implements ServiceEquipmentDirectoryPort {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);
  private readonly loadEquipmentDirectoryUseCase = inject(LoadEquipmentDirectoryUseCase);

  loadDirectory(): Observable<ServiceEquipmentDirectory> {
    return forkJoin({
      sites: this.loadSitesUseCase.execute(),
      equipment: this.loadEquipmentDirectoryUseCase.execute(),
    }).pipe(
      map(({ sites, equipment }) => ({
        equipment: equipment.map(({ id, name, siteId }) => ({ id, name, siteId })),
        sites: sites.map(({ id, name }) => ({ id, name })),
      })),
    );
  }
}
