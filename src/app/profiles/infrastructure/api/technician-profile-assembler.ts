import { BaseAssembler } from '@shared/infrastructure/api/base-assembler';
import { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import { TechnicianProfileResource, TechnicianProfileResponse } from '@profiles/infrastructure/api/technician-profile.response';
import { isSpeciality, Speciality } from '@profiles/domain/value-objects/speciality';

/**
 * The `TechnicianProfileAssembler` class is responsible for converting between `TechnicianProfile` entities and their corresponding API resources and responses.
 */
export class TechnicianProfileAssembler implements BaseAssembler<
  TechnicianProfile,
  TechnicianProfileResource,
  TechnicianProfileResponse
> {
  /**
   * Converts a `TechnicianProfileResource` to a `TechnicianProfile` entity.
   * @param resource - The `TechnicianProfileResource` to convert.
   * @returns An instance of `TechnicianProfile` entity.
   */
  toEntityFromResource(resource: TechnicianProfileResource): TechnicianProfile {
    return new TechnicianProfile({
      id: resource.id,
      user_id: resource.user_id,
      full_name: resource.full_name,
      email: resource.email,
      phone: resource.phone,
      address: resource.address,
      specialty: this.toSpeciality(resource.specialty),
      certification_number: resource.certification_number,
    });
  }

  /**
   * Converts a `TechnicianProfile` entity to a `TechnicianProfileResource`.
   * @param entity - The `TechnicianProfile` entity to convert.
   * @returns An instance of `TechnicianProfileResource`.
   */
  toResourceFromEntity(entity: TechnicianProfile): TechnicianProfileResource {
    return {
      id: entity.id,
      user_id: entity.user_id,
      full_name: entity.full_name,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      specialty: entity.specialty,
      certification_number: entity.certification_number,
    };
  }

  /**
   * Converts a `TechnicianProfileResponse` to an array of `TechnicianProfile` entities.
   * @param response - The `TechnicianProfileResponse` to convert.
   * @returns An array of `TechnicianProfile` entities.
   */
  toEntitiesFromResponse(response: TechnicianProfileResponse): TechnicianProfile[] {
    return response.technician_profiles.map((resource) =>
      this.toEntityFromResource(resource as TechnicianProfileResource),
    );
  }

  /**
   * Converts a string value to a `Speciality` type, throwing an error if the value is not a valid speciality.
   * @param value - The string value to convert.
   * @returns The corresponding `Speciality` type.
   * @throws {Error} If the value is not a valid speciality.
   * @private
   */
  private toSpeciality(value: string): Speciality {
    if (!isSpeciality(value)) {
      throw new Error(`Unsupported speciality value: ${value}`);
    }
    return value;
  }
}
