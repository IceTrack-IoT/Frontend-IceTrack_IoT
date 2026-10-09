import { BaseApiEndpoint } from '@shared/infrastructure/api/base-api-endpoint';
import { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import { TechnicianProfileResource, TechnicianProfileResponse } from '@profiles/infrastructure/api/technician-profile.response';
import { TechnicianProfileAssembler } from '@profiles/infrastructure/api/technician-profile-assembler';
import { environment } from '@env/environment';
import { HttpClient } from '@angular/common/http';

/**
 * TechnicianProfileApiEndpoint is responsible for handling API operations related to TechnicianProfile entities.
 */
export class TechnicianProfileApiEndpoint extends BaseApiEndpoint<TechnicianProfile, TechnicianProfileResource, TechnicianProfileResponse, TechnicianProfileAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderTechnicianProfilesEndpointPath}`,
      new TechnicianProfileAssembler());
  }
}
