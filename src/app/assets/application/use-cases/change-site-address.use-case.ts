import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import { SitesPort } from '@assets/application/ports/sites.port';

/**
 * Moves one of the owner's sites to a verified address, keeping its equipment.
 */
@Injectable({
  providedIn: 'root',
})
export class ChangeSiteAddressUseCase {
  private readonly port = inject(SitesPort);

  /**
   * @param siteId - The identifier of the site.
   * @param validationToken - The token of the verified address.
   * @returns An Observable of the moved site.
   */
  execute(siteId: number, validationToken: string): Observable<Site> {
    return this.port.changeSiteAddress(siteId, validationToken);
  }
}
