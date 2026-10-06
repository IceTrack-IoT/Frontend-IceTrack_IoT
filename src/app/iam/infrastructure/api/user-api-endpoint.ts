import { BaseApiEndpoint } from '@shared/infrastructure/api/base-api-endpoint';
import { User } from '@iam/domain/model/user.entity';
import { UserResource, UserResponse } from '@iam/infrastructure/api/user.response';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * UserApiEndpoint is responsible for handling API operations related to User entities.
 */
export class UserApiEndpoint extends BaseApiEndpoint<User, UserResource, UserResponse, UserAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderUsersEndpointPath}`,
      new UserAssembler());
  }
}
