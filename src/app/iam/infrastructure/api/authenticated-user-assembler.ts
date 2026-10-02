import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';
import type { AuthenticatedUserResource } from '@iam/infrastructure/api/authenticated-user.response';
import { UserAssembler } from '@iam/infrastructure/api/user-assembler';

/**
 * AuthenticatedUserAssembler is responsible for converting authentication resources into authentication results.
 */
export class AuthenticatedUserAssembler {
  private readonly userAssembler = new UserAssembler();

  /**
   * Converts an AuthenticatedUserResource to an AuthenticationResult.
   * @param resource The AuthenticatedUserResource to convert.
   * @returns The corresponding AuthenticationResult.
   */
  toAuthenticationResultFromResource(resource: AuthenticatedUserResource): AuthenticationResult {
    return {
      user: this.userAssembler.toEntityFromAuthenticatedUserResource(resource),
      accessToken: resource.token,
      refreshToken: resource.refresh_token,
    };
  }
}
