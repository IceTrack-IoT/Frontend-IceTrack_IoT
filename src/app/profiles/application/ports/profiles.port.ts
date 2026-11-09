import type { Observable } from 'rxjs';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import type { OwnerProfileUpdate } from '@profiles/application/contracts/owner-profile-update';

/**
 * ProfilesPort is the outbound port used by Profiles use cases to read and update the owner profile and to
 * consult technician profiles read-only.
 *
 * Definitive backend rejections (any 4xx answer) are reported as ProfilesError; any other error is
 * transient. Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ProfilesPort {
  /**
   * Retrieves the owner profile bound to a platform account.
   * Fails with ProfilesError code `OWNER_NOT_FOUND` when no owner profile is bound to the account.
   * @param userId - The identifier of the platform account.
   * @returns An Observable of the owner profile of the account.
   */
  abstract getOwnerProfileByUserId(userId: number): Observable<OwnerProfile>;

  /**
   * Replaces the name, contact details, address and RUC of the caller's own owner profile.
   * Fails with ProfilesError code `VALIDATION_ERROR` (e.g. a RUC that is not 11 digits) or
   * `ACCESS_DENIED` (not the caller's own profile).
   * @param ownerId - The identifier of the owner profile (not the account id).
   * @param update - The new profile data.
   * @returns An Observable of the updated owner profile.
   */
  abstract updateOwnerProfile(
    ownerId: number,
    update: OwnerProfileUpdate,
  ): Observable<OwnerProfile>;

  /**
   * Retrieves the technician directory. Contact data is null except for technicians actively assigned to
   * one of the owner's service requests.
   * @returns An Observable of the technician profiles.
   */
  abstract getTechnicianProfiles(): Observable<TechnicianProfile[]>;

  /**
   * Retrieves the public profile of a technician, with its service statistics.
   * Fails with ProfilesError code `TECHNICIAN_NOT_FOUND` when no technician carries the identifier.
   * @param technicianId - The identifier of the technician profile.
   * @returns An Observable of the public profile.
   */
  abstract getTechnicianPublicProfile(technicianId: number): Observable<TechnicianPublicProfile>;
}
