import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { TechnicianSummary } from '@service/application/contracts/technician-candidate';
import { TechnicianProfilePort } from '@service/application/ports/technician-profile.port';

/**
 * Loads the technician directory, used to show who is assigned to each request and who acted in its
 * history.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadTechnicianDirectoryUseCase {
  private readonly technicianProfiles = inject(TechnicianProfilePort);

  /**
   * @returns An Observable of the technician summaries.
   */
  execute(): Observable<TechnicianSummary[]> {
    return this.technicianProfiles.listTechnicians();
  }
}
