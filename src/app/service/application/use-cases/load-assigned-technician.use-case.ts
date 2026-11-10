import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { TechnicianCandidate } from '@service/application/contracts/technician-candidate';
import { TechnicianProfilePort } from '@service/application/ports/technician-profile.port';

/**
 * Loads the public profile of the technician assigned to a service request.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadAssignedTechnicianUseCase {
  private readonly technicianProfiles = inject(TechnicianProfilePort);

  /**
   * @param technicianId - The identifier of the assigned technician profile.
   * @returns An Observable of the technician with its statistics.
   */
  execute(technicianId: number): Observable<TechnicianCandidate> {
    return this.technicianProfiles.getTechnicianCandidate(technicianId);
  }
}
