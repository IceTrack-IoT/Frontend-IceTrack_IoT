import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';

/**
 * Updates the data of an existing owner profile on the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class UpdateOwnerProfileUseCase {
  private readonly profiles = inject(ProfilesPort);

  /**
   * @param profile - The owner profile with its new data.
   * @returns An Observable of the updated owner profile, as the backend stored it.
   */
  execute(profile: OwnerProfile): Observable<OwnerProfile> {
    return this.profiles.updateOwnerProfile(profile);
  }
}
