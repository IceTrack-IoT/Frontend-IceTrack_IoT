import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { TechnicianCandidate } from '@service/application/contracts/technician-candidate';
import { TechnicianProfilePort } from '@service/application/ports/technician-profile.port';

/**
 * Loads the technicians an owner can assign, with the statistics needed to choose one.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadTechnicianCandidatesUseCase {
  private readonly technicianProfiles = inject(TechnicianProfilePort);

  /**
   * @returns An Observable of the candidates, sorted by name.
   */
  execute(): Observable<TechnicianCandidate[]> {
    return this.technicianProfiles
      .listTechnicianCandidates()
      .pipe(
        map((candidates) =>
          [...candidates].sort((first, second) => first.fullName.localeCompare(second.fullName)),
        ),
      );
  }
}
