import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import type { AuthenticatedUserResponse } from '@iam/infrastructure/api/authenticated-user.response';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';

/**
 * AuthenticatedUserAssembler is responsible for converting authentication resources into authentication results.
 */
export class AuthenticatedUserAssembler {
  private readonly userAssembler = new UserAssembler();

  /**
   * Converts an AuthenticatedUserResponse to an AuthenticationResult.
   * @param resource The AuthenticatedUserResponse to convert.
   * @returns The corresponding AuthenticationResult.
   */
  toAuthenticationResultFromResponse(resource: AuthenticatedUserResponse): AuthenticationResult {
    return {
      user: this.userAssembler.toEntityFromAuthenticatedUserResponse(resource),
      accessToken: resource.token,
      refreshToken: resource.refresh_token,
    };
  }
}
