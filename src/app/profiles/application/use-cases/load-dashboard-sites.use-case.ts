import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { DashboardSite } from '@profiles/application/contracts/dashboard-site';
import { DashboardSiteDirectoryPort } from '@profiles/application/ports/dashboard-site-directory.port';

/**
 * Loads the sites the dashboard can open on, through the narrow site directory port that Assets
 * implements.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadDashboardSitesUseCase {
  private readonly siteDirectory = inject(DashboardSiteDirectoryPort);

  /**
   * @returns An Observable of the signed-in owner's sites, sorted by name.
   */
  execute(): Observable<DashboardSite[]> {
    return this.siteDirectory
      .listSites()
      .pipe(
        map((sites) => [...sites].sort((first, second) => first.name.localeCompare(second.name))),
      );
  }
}
