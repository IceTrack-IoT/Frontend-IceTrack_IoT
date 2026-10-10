import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';

/**
 * Loads the owner profiles from the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadOwnerProfilesUseCase {
  private readonly profiles = inject(ProfilesPort);

  /**
   * @returns An Observable of the owner profiles.
   */
  execute(): Observable<OwnerProfile[]> {
    return this.profiles.getOwnerProfiles();
  }
}
