import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { TechnicianProfileResource } from '@profiles/infrastructure/api/technician-profile.response';
import type { TechnicianPublicProfileResource } from '@profiles/infrastructure/api/technician-public-profile.response';

/**
 * TechnicianProfileApiEndpoint sends the owner-facing, read-only requests of the
 * `TechnicianProfilesController`.
 */
export class TechnicianProfileApiEndpoint {
  private readonly directoryEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderTechnicianProfilesEndpointPath}`;
  private readonly publicProfileEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderTechnicianPublicProfileEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves the technician directory (`GET /profiles/technicians`).
   * @returns An Observable of the TechnicianProfileResource array.
   */
  getAll(): Observable<TechnicianProfileResource[]> {
    return this.http.get<TechnicianProfileResource[]>(this.directoryEndpointUrl);
  }

  /**
   * Retrieves the public profile of a technician (`GET /profiles/technicians/{technicianId}/public`).
   * @param technicianId - The identifier of the technician profile.
   * @returns An Observable of the TechnicianPublicProfileResource.
   */
  getPublicProfile(technicianId: number): Observable<TechnicianPublicProfileResource> {
    return this.http.get<TechnicianPublicProfileResource>(
      this.publicProfileEndpointUrl.replace('{technicianId}', String(technicianId)),
    );
  }
}
