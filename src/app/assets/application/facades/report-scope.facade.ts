import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { LoadAllEquipmentUseCase } from '@assets/application/use-cases/load-all-equipment.use-case';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import type { ReportScope } from '@reporting/application/contracts/report-scope';
import type { ReportScopePort } from '@reporting/application/ports/report-scope.port';

/**
 * ReportScopeFacade implements the ReportScopePort of Reporting with the Assets Management use cases. It
 * exposes only the identifier and name of each site, and the identifier, name and site of each equipment
 * item; the backend scopes every read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportScopeFacade implements ReportScopePort {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);
  private readonly loadAllEquipmentUseCase = inject(LoadAllEquipmentUseCase);

  loadScope(): Observable<ReportScope> {
    return forkJoin({
      sites: this.loadSitesUseCase.execute(),
      equipment: this.loadAllEquipmentUseCase.execute(),
    }).pipe(
      map(({ sites, equipment }) => ({
        sites: sites.map(({ id, name }) => ({ id, name })),
        equipment: equipment.map((item) => ({
          id: item.id,
          name: item.name,
          siteId: item.site_id,
        })),
      })),
    );
  }
}
