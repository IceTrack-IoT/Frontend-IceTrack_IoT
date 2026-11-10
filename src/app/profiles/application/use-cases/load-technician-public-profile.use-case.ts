import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';

/**
 * Loads the public profile of a technician, with its service statistics, for owners to consult read-only.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadTechnicianPublicProfileUseCase {
  private readonly profiles = inject(ProfilesPort);

  /**
   * @param technicianId - The identifier of the technician profile.
   * @returns An Observable of the public profile.
   */
  execute(technicianId: number): Observable<TechnicianPublicProfile> {
    return this.profiles.getTechnicianPublicProfile(technicianId);
  }
}
