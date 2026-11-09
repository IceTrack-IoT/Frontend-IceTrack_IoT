import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { SiteSummary } from '@assets/application/contracts/site-summary';
import type { SiteDirectoryPort } from '@assets/application/ports/site-directory.port';
import type { SiteResource } from '@assets/infrastructure/api/site.response';

/**
 * SiteDirectoryApi implements the SiteDirectoryPort with `GET /assets/sites`, which lists only the sites
 * of the authenticated owner.
 */
@Injectable({
  providedIn: 'root',
})
export class SiteDirectoryApi implements SiteDirectoryPort {
  private readonly http = inject(HttpClient);
  private readonly sitesEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderSitesEndpointPath}`;

  listSites(): Observable<SiteSummary[]> {
    return this.http
      .get<SiteResource[]>(this.sitesEndpointUrl)
      .pipe(map((resources) => resources.map(({ id, name }) => ({ id, name }))));
  }
}
