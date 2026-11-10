import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { LoadSitesUseCase } from '@assets/application/use-cases/load-sites.use-case';
import type { DashboardSite } from '@profiles/application/contracts/dashboard-site';
import type { DashboardSiteDirectoryPort } from '@profiles/application/ports/dashboard-site-directory.port';

/**
 * DashboardSiteFacade implements the DashboardSiteDirectoryPort of Profiles with the Assets site list. It
 * exposes only the identifier and name of each site; the backend scopes the read to the signed-in owner.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardSiteFacade implements DashboardSiteDirectoryPort {
  private readonly loadSitesUseCase = inject(LoadSitesUseCase);

  listSites(): Observable<DashboardSite[]> {
    return this.loadSitesUseCase
      .execute()
      .pipe(map((sites) => sites.map(({ id, name }) => ({ id, name }))));
  }
}
