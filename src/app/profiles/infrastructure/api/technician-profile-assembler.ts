import { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import type { TechnicianProfileResource } from '@profiles/infrastructure/api/technician-profile.response';
import type { TechnicianPublicProfileResource } from '@profiles/infrastructure/api/technician-public-profile.response';

/**
 * TechnicianProfileAssembler converts technician profile resources into read-only entities.
 */
export class TechnicianProfileAssembler {
  /**
   * Converts a TechnicianProfileResource to a TechnicianProfile entity.
   * @param resource - The TechnicianProfileResource to convert.
   * @returns The corresponding TechnicianProfile entity.
   */
  toEntityFromResource(resource: TechnicianProfileResource): TechnicianProfile {
    return new TechnicianProfile({
      id: resource.id,
      user_id: resource.user_id,
      full_name: resource.full_name,
      email: resource.email ?? null,
      phone: resource.phone ?? null,
      address: resource.address ?? null,
      speciality: resource.speciality,
      certification_number: resource.certification_number,
    });
  }

  /**
   * Converts a TechnicianPublicProfileResource to a TechnicianPublicProfile entity.
   * @param resource - The TechnicianPublicProfileResource to convert.
   * @returns The corresponding TechnicianPublicProfile entity.
   */
  toPublicProfileFromResource(resource: TechnicianPublicProfileResource): TechnicianPublicProfile {
    return new TechnicianPublicProfile({
      id: resource.id,
      full_name: resource.full_name,
      speciality: resource.speciality,
      certification_number: resource.certification_number,
      completed_services: resource.completed_services,
      average_rating: resource.average_rating ?? null,
      rating_available: resource.rating_available,
    });
  }
}
