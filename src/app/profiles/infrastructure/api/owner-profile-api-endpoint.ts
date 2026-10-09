import { BaseApiEndpoint } from '@shared/infrastructure/api/base-api-endpoint';
import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import { OwnerProfileResource, OwnerProfileResponse } from '@profiles/infrastructure/api/owner-profile.response';
import { OwnerProfileAssembler } from '@profiles/infrastructure/api/owner-profile-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * OwnerProfileApiEndpoint is responsible for handling API operations related to OwnerProfile entities.
 */
export class OwnerProfileApiEndpoint extends BaseApiEndpoint<OwnerProfile, OwnerProfileResource, OwnerProfileResponse, OwnerProfileAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderOwnerProfilesEndpointPath}`,
      new OwnerProfileAssembler());
  }
}
