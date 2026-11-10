import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import type { OwnerProfileUpdate } from '@profiles/application/contracts/owner-profile-update';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';

/**
 * Replaces the data of the signed-in owner's profile on the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class UpdateOwnerProfileUseCase {
  private readonly profiles = inject(ProfilesPort);

  /**
   * @param ownerId - The identifier of the owner profile (not the account id).
   * @param update - The new profile data, with the complete address.
   * @returns An Observable of the updated owner profile, as the backend stored it.
   */
  execute(ownerId: number, update: OwnerProfileUpdate): Observable<OwnerProfile> {
    return this.profiles.updateOwnerProfile(ownerId, update);
  }
}
