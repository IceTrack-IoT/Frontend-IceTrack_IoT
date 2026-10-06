import { BaseAssembler } from '@shared/infrastructure/api/base-assembler';
import { User } from '@iam/domain/model/user.entity';
import { UserResource, UserResponse } from '@iam/infrastructure/api/user.response';
import type { CurrentUserResource } from '@iam/infrastructure/api/current-user.response';
import type { AuthenticatedUserResource } from '@iam/infrastructure/api/authenticated-user.response';
import { isRole, Role } from '@iam/domain/value-objects/role';
import { AuthProvider, isAuthProvider } from '@iam/domain/value-objects/auth-provider';

/**
 * UserAssembler is responsible for converting between User entities and User resources.
 */
export class UserAssembler implements BaseAssembler<User, UserResource, UserResponse> {
  /**
   * Converts a UserResource to a User entity.
   * @param resource The UserResource to convert.
   * @returns The corresponding User entity.
   */
  toEntityFromResource(resource: UserResource): User {
    return new User({
      id: resource.id,
      username: resource.username,
      role: this.toRole(resource.role),
      provider: this.toAuthProvider(resource.provider),
    });
  }

  /**
   * Converts a CurrentUserResource to a User entity.
   * @param resource The CurrentUserResource to convert.
   * @returns The corresponding User entity.
   */
  toEntityFromCurrentUserResource(resource: CurrentUserResource): User {
    return new User({
      id: resource.id,
      username: resource.username,
      role: this.toRole(resource.role),
      provider: this.toAuthProvider(resource.provider),
    });
  }

  /**
   * Converts the user part of an AuthenticatedUserResource to a User entity.
   * @param resource The AuthenticatedUserResource to convert.
   * @returns The corresponding User entity.
   */
  toEntityFromAuthenticatedUserResource(resource: AuthenticatedUserResource): User {
    return new User({
      id: resource.id,
      username: resource.username,
      role: this.toRole(resource.role),
      provider: this.toAuthProvider(resource.provider),
    });
  }

  /**
   * Converts a User entity to a UserResource.
   * @param entity The User entity to convert.
   * @returns The corresponding UserResource.
   */
  toResourceFromEntity(entity: User): UserResource {
    if (entity.provider === null) {
      throw new Error(`User ${entity.id} has no known provider and cannot be converted to a UserResource`);
    }
    return {
      id: entity.id,
      username: entity.username,
      role: entity.role,
      provider: entity.provider,
    };
  }

  /**
   * Converts a UserResponse to an array of User entities.
   * @param response The UserResponse to convert.
   * @returns An array of User entities.
   */
  toEntitiesFromResponse(response: UserResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource as UserResource));
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
