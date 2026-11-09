import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { SiteDirectoryPort } from '@assets/application/ports/site-directory.port';
import type { DashboardSite } from '@profiles/application/contracts/dashboard-site';

/**
 * Loads the sites the dashboard can open on, through the narrow site directory that Assets offers.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadDashboardSitesUseCase {
  private readonly siteDirectory = inject(SiteDirectoryPort);

  /**
   * @returns An Observable of the signed-in owner's sites, sorted by name.
   */
  execute(): Observable<DashboardSite[]> {
    return this.siteDirectory
      .listSites()
      .pipe(
        map((sites) =>
          sites
            .map(({ id, name }) => ({ id, name }))
            .sort((first, second) => first.name.localeCompare(second.name)),
        ),
      );
  }
}
