import { BaseAssembler } from '@shared/infrastructure/api/base-assembler';
import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import { OwnerProfileResource, OwnerProfileResponse } from '@profiles/infrastructure/api/owner-profile.response';

/**
 * The `OwnerProfileAssembler` class is responsible for converting between `OwnerProfile` entities and their corresponding API resources and responses.
 */
export class OwnerProfileAssembler implements BaseAssembler<
  OwnerProfile,
  OwnerProfileResource,
  OwnerProfileResponse
> {
  /**
   * Converts an `OwnerProfileResource` to an `OwnerProfile` entity.
   *
   * @param resource - The `OwnerProfileResource` to convert.
   * @returns An instance of `OwnerProfile` entity.
   */
  toEntityFromResource(resource: OwnerProfileResource): OwnerProfile {
    return new OwnerProfile({
      id: resource.id,
      user_id: resource.user_id,
      full_name: resource.full_name,
      email: resource.email,
      phone: resource.phone,
      address: resource.address,
      ruc: resource.ruc,
    });
  }

  /**
   * Converts an `OwnerProfile` entity to an `OwnerProfileResource`.
   *
   * @param entity - The `OwnerProfile` entity to convert.
   * @returns An instance of `OwnerProfileResource`.
   */
  toResourceFromEntity(entity: OwnerProfile): OwnerProfileResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      full_name: entity.full_name,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      ruc: entity.ruc,
    };
  }

  /**
   * Converts an `OwnerProfileResponse` to an array of `OwnerProfile` entities.
   *
   * @param response - The `OwnerProfileResponse` to convert.
   * @returns An array of `OwnerProfile` entities.
   */
  toEntitiesFromResponse(response: OwnerProfileResponse): OwnerProfile[] {
    return response.owner_profiles.map((resource) => this.toEntityFromResource(resource as OwnerProfileResource));
  }
}
