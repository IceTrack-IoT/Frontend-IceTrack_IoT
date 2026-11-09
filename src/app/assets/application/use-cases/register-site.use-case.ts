import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import { type NewSite, trimSiteDetails } from '@assets/application/contracts/site-registration';
import { SitesPort } from '@assets/application/ports/sites.port';

/**
 * Registers a site of the owner at a verified address. The owner is taken from the authenticated
 * identity, never from the request.
 */
@Injectable({
  providedIn: 'root',
})
export class RegisterSiteUseCase {
  private readonly port = inject(SitesPort);

  /**
   * @param site - The contact data and the validation token.
   * @returns An Observable of the registered site.
   */
  execute(site: NewSite): Observable<Site> {
    return this.port.registerSite({
      ...trimSiteDetails(site),
      validationToken: site.validationToken,
    });
  }
}
