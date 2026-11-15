import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Site } from '@assets/domain/model/site.entity';
import type { NewSite, SiteDetails } from '@assets/application/contracts/site-registration';
import type { VerifiedAddress } from '@assets/application/contracts/verified-address';
import type { SitesPort } from '@assets/application/ports/sites.port';
import { AssetsApiEndpoint } from '@assets/infrastructure/api/assets-api-endpoint';
import { AssetsAssembler } from '@assets/infrastructure/api/assets-assembler';
import { mapAssetsErrors } from '@assets/infrastructure/api/assets-error-mapping';

/**
 * SitesApi implements the SitesPort against the owner site endpoints of Assets Management.
 */
@Injectable({
  providedIn: 'root',
})
export class SitesApi extends BaseApi implements SitesPort {
  private readonly endpoint = new AssetsApiEndpoint(inject(HttpClient));
  private readonly assembler = new AssetsAssembler();

  validateAddress(address: string): Observable<VerifiedAddress> {
    return this.endpoint.validateAddress({ address, place_id: null }).pipe(
      mapAssetsErrors(),
      map((resource) => this.assembler.toVerifiedAddressFromResource(resource)),
    );
  }

  registerSite(site: NewSite): Observable<Site> {
    return this.endpoint.registerSite(this.assembler.toRegisterSiteRequest(site)).pipe(
      mapAssetsErrors(),
      map((resource) => this.assembler.toSiteFromResource(resource)),
    );
  }

  listSites(): Observable<Site[]> {
    return this.endpoint.listSites().pipe(
      mapAssetsErrors(),
      map((resources) => resources.map((resource) => this.assembler.toSiteFromResource(resource))),
    );
  }

  updateSite(siteId: number, version: number, details: SiteDetails): Observable<Site> {
    return this.endpoint
      .updateSite(siteId, version, this.assembler.toUpdateSiteRequest(details))
      .pipe(
        mapAssetsErrors(),
        map((resource) => this.assembler.toSiteFromResource(resource)),
      );
  }

  changeSiteAddress(siteId: number, version: number, validationToken: string): Observable<Site> {
    return this.endpoint
      .updateSiteAddress(siteId, version, { validation_token: validationToken })
      .pipe(
        mapAssetsErrors(),
        map((resource) => this.assembler.toSiteFromResource(resource)),
      );
  }

  retrySiteGeocoding(siteId: number): Observable<Site> {
    return this.endpoint.retrySiteGeocoding(siteId).pipe(
      mapAssetsErrors(),
      map((resource) => this.assembler.toSiteFromResource(resource)),
    );
  }
}
