import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { LoadEquipmentDirectoryUseCase } from '@assets/application/use-cases/load-equipment-directory.use-case';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import type { ReportScope } from '@reporting/application/contracts/report-scope';
import type { ReportScopePort } from '@reporting/application/ports/report-scope.port';

/**
 * ReportScopeFacade implements the ReportScopePort of Reporting with the Assets site list and equipment
 * directory. It exposes only the identifier and name of each site, and the identifier, name and site of
 * each equipment item; the backend scopes every read to the signed-in owner. Sites are read on their own
 * so a site without equipment can still be chosen.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportScopeFacade implements ReportScopePort {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);
  private readonly loadEquipmentDirectoryUseCase = inject(LoadEquipmentDirectoryUseCase);

  loadScope(): Observable<ReportScope> {
    return forkJoin({
      sites: this.loadSitesUseCase.execute(),
      equipment: this.loadEquipmentDirectoryUseCase.execute(),
    }).pipe(
      map(({ sites, equipment }) => ({
        sites: sites.map(({ id, name }) => ({ id, name })),
        equipment: equipment.map(({ id, name, siteId }) => ({ id, name, siteId })),
      })),
    );
  }
}
