import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import { SitesPort } from '@assets/application/ports/sites.port';

/**
 * Looks the current address of a site that is not located up again, so it regains its map location. The
 * backend decides when a retry is allowed and continues slow lookups in the background.
 */
@Injectable({
  providedIn: 'root',
})
export class RetrySiteGeocodingUseCase {
  private readonly port = inject(SitesPort);

  /**
   * @param siteId - The identifier of the site.
   * @returns An Observable of the site after the lookup: located, not found with its reason, or still
   *  pending.
   */
  execute(siteId: number): Observable<Site> {
    return this.port.retrySiteGeocoding(siteId);
  }
}
