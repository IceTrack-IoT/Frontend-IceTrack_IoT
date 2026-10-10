import type { Observable } from 'rxjs';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';

/**
 * ProfilesPort is the outbound port used by Profiles use cases to read and update owner and technician
 * profiles on the backend.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ProfilesPort {
  /**
   * Retrieves the owner profiles.
   * @returns An Observable of the owner profiles.
   */
  abstract getOwnerProfiles(): Observable<OwnerProfile[]>;

  /**
   * Retrieves the owner profile bound to a platform account.
   * @param userId - The identifier of the platform account.
   * @returns An Observable of the owner profile of the account.
   */
  abstract getOwnerProfileByUserId(userId: number): Observable<OwnerProfile>;

  /**
   * Replaces the data of an existing owner profile.
   * @param profile - The owner profile with its new data.
   * @returns An Observable of the updated owner profile.
   */
  abstract updateOwnerProfile(profile: OwnerProfile): Observable<OwnerProfile>;

  /**
   * Retrieves the technician profiles, which owners consult read-only, for example to assign a service
   * request.
   * @returns An Observable of the technician profiles.
   */
  abstract getTechnicianProfiles(): Observable<TechnicianProfile[]>;
}
