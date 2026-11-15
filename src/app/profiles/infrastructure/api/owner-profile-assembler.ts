import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import type { OwnerProfileUpdate } from '@profiles/application/contracts/owner-profile-update';
import type { OwnerProfileResource } from '@profiles/infrastructure/api/owner-profile.response';
import type { UpdateOwnerProfileRequest } from '@profiles/infrastructure/api/update-owner-profile.request';

/**
 * OwnerProfileAssembler converts owner profile resources into entities and owner profile updates into
 * request bodies.
 */
export class OwnerProfileAssembler {
  /**
   * Converts an OwnerProfileResource to an OwnerProfile entity.
   * @param resource - The OwnerProfileResource to convert.
   * @returns The corresponding OwnerProfile entity.
   */
  toEntityFromResource(resource: OwnerProfileResource): OwnerProfile {
    return new OwnerProfile({
      id: resource.id,
      user_id: resource.user_id,
      full_name: resource.full_name,
      email: resource.email,
      phone: resource.phone,
      address: resource.address,
      street: resource.street,
      number: resource.number ?? null,
      city: resource.city,
      postal_code: resource.postal_code,
      country: resource.country,
      ruc: resource.ruc,
      version: resource.version,
    });
  }

  /**
   * Converts an OwnerProfileUpdate to the body of the owner profile update request.
   * @param update - The new profile data.
   * @returns The corresponding UpdateOwnerProfileRequest.
   */
  toRequestFromUpdate(update: OwnerProfileUpdate): UpdateOwnerProfileRequest {
    return {
      full_name: update.fullName,
      phone: update.phone,
      street: update.street,
      number: update.number,
      city: update.city,
      postal_code: update.postalCode,
      country: update.country,
      ruc: update.ruc,
    };
  }
}
