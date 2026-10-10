import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';

/**
 * Loads the owner profile bound to a platform account from the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadOwnerProfileByUserIdUseCase {
  private readonly profiles = inject(ProfilesPort);

  /**
   * @param userId - The identifier of the platform account.
   * @returns An Observable of the owner profile of the account.
   */
  execute(userId: number): Observable<OwnerProfile> {
    return this.profiles.getOwnerProfileByUserId(userId);
  }
}
