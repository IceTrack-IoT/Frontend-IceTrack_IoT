import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import { type SiteDetails, trimSiteDetails } from '@assets/application/contracts/site-registration';
import { SitesPort } from '@assets/application/ports/sites.port';

/**
 * Replaces the name, contact name and phone of one of the owner's sites. Its address does not change.
 */
@Injectable({
  providedIn: 'root',
})
export class UpdateSiteUseCase {
  private readonly port = inject(SitesPort);

  /**
   * @param site - The site as it was read; the change is refused when it changed since.
   * @param details - The new contact data.
   * @returns An Observable of the updated site.
   */
  execute(site: Site, details: SiteDetails): Observable<Site> {
    return this.port.updateSite(site.id, site.version, trimSiteDetails(details));
  }
}
