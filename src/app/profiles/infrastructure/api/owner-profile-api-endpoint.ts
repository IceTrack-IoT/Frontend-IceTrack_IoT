import { BaseApiEndpoint } from '@shared/infrastructure/api/base-api-endpoint';
import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import { OwnerProfileResource, OwnerProfileResponse } from '@profiles/infrastructure/api/owner-profile.response';
import { OwnerProfileAssembler } from '@profiles/infrastructure/api/owner-profile-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { catchError, map, Observable } from 'rxjs';
import { handleError } from '@shared/infrastructure/http/handle-error-http';

/**
 * OwnerProfileApiEndpoint is responsible for handling API operations related to OwnerProfile entities.
 */
export class OwnerProfileApiEndpoint extends BaseApiEndpoint<
  OwnerProfile,
  OwnerProfileResource,
  OwnerProfileResponse,
  OwnerProfileAssembler
> {
  private readonly getOwnerProfileByUserIdEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderGetOwnerProfileByUserIdEndpointPath}`;

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderOwnerProfilesEndpointPath}`,
      new OwnerProfileAssembler(),
    );
  }

  /**
   * Retrieves the owner profile bound to a platform account (`GET /profiles/owners/user/{userId}`).
   * @param userId - The unique identifier of the platform account.
   * @returns An Observable of the owner profile.
   */
  getByUserId(userId: number): Observable<OwnerProfile> {
    return this.http
      .get<OwnerProfileResource>(
        `${this.getOwnerProfileByUserIdEndpointUrl.replace('{userId}', userId.toString())}`,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(handleError('Failed to fetch owner profile')),
      );
  }
}
