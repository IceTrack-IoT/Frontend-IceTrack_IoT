import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import { SitesPort } from '@assets/application/ports/sites.port';

/**
 * Loads the owner's sites, sorted by name.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadSitesUseCase {
  private readonly port = inject(SitesPort);

  /**
   * @returns An Observable of the sites.
   */
  execute(): Observable<Site[]> {
    return this.port
      .listSites()
      .pipe(
        map((sites) => [...sites].sort((first, second) => first.name.localeCompare(second.name))),
      );
  }
}
