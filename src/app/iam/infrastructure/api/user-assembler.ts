import { User } from '@iam/domain/model/user.entity';
import type { UserResource } from '@iam/infrastructure/api/user.response';
import type { CurrentUserResponse } from '@iam/infrastructure/api/current-user.response';
import type { AuthenticatedUserResponse } from '@iam/infrastructure/api/authenticated-user.response';
import { isRole, type Role } from '@iam/domain/value-objects/role';
import { type AuthProvider, isAuthProvider } from '@iam/domain/value-objects/auth-provider';

/**
 * UserAssembler is responsible for converting the IAM user resources into User entities.
 */
export class UserAssembler {
  /**
   * Converts a UserResource to a User entity.
   * @param resource The UserResource to convert.
   * @returns The corresponding User entity.
   */
  toEntityFromResource(resource: UserResource): User {
    return this.toEntity(resource);
  }

  /**
   * Converts a CurrentUserResponse to a User entity. The profile `email` is not part of the user entity.
   * @param resource The CurrentUserResponse to convert.
   * @returns The corresponding User entity.
   */
  toEntityFromCurrentUserResponse(resource: CurrentUserResponse): User {
    return this.toEntity(resource);
  }

  /**
   * Converts the user part of an AuthenticatedUserResponse to a User entity.
   * @param resource The AuthenticatedUserResponse to convert.
   * @returns The corresponding User entity.
   */
  toEntityFromAuthenticatedUserResponse(resource: AuthenticatedUserResponse): User {
    return this.toEntity(resource);
  }

  private toEntity(resource: UserResource): User {
    return new User({
      id: resource.id,
      username: resource.username,
      role: this.toRole(resource.role),
      provider: this.toAuthProvider(resource.provider),
    });
  }

  private toRole(value: string): Role {
    if (!isRole(value)) {
      throw new Error(`Unsupported role: ${value}`);
    }
    return value;
  }

  private toAuthProvider(value: string): AuthProvider {
    if (!isAuthProvider(value)) {
      throw new Error(`Unsupported authentication provider: ${value}`);
    }
    return value;
  }
}
