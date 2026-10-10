import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';

/**
 * Loads the technician profiles from the backend, for owners to consult read-only.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadTechnicianProfilesUseCase {
  private readonly profiles = inject(ProfilesPort);

  /**
   * @returns An Observable of the technician profiles.
   */
  execute(): Observable<TechnicianProfile[]> {
    return this.profiles.getTechnicianProfiles();
  }
}
