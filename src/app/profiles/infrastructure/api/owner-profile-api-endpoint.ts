import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { OwnerProfileResource } from '@profiles/infrastructure/api/owner-profile.response';
import type { UpdateOwnerProfileRequest } from '@profiles/infrastructure/api/update-owner-profile.request';

/**
 * OwnerProfileApiEndpoint sends the owner profile requests of the `OwnerProfilesController`.
 */
export class OwnerProfileApiEndpoint {
  private readonly byUserIdEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderGetOwnerProfileByUserIdEndpointPath}`;
  private readonly updateEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderUpdateOwnerProfileEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves the owner profile bound to a platform account (`GET /profiles/owners/user/{userId}`).
   * @param userId - The identifier of the platform account.
   * @returns An Observable of the OwnerProfileResource.
   */
  getByUserId(userId: number): Observable<OwnerProfileResource> {
    return this.http.get<OwnerProfileResource>(
      this.byUserIdEndpointUrl.replace('{userId}', String(userId)),
    );
  }

  /**
   * Replaces the caller's own owner profile (`PUT /profiles/owners/{ownerId}`).
   * @param ownerId - The identifier of the owner profile.
   * @param request - The UpdateOwnerProfileRequest.
   * @returns An Observable of the updated OwnerProfileResource.
   */
  update(ownerId: number, request: UpdateOwnerProfileRequest): Observable<OwnerProfileResource> {
    return this.http.put<OwnerProfileResource>(
      this.updateEndpointUrl.replace('{ownerId}', String(ownerId)),
      request,
    );
  }
}
