import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import { LoadTechnicianDirectoryUseCase } from '@profiles/application/use-cases/load-technician-directory.use-case';
import { LoadTechnicianPublicProfileUseCase } from '@profiles/application/use-cases/load-technician-public-profile.use-case';
import type {
  TechnicianCandidate,
  TechnicianSummary,
} from '@service/application/contracts/technician-candidate';
import type { TechnicianProfilePort } from '@service/application/ports/technician-profile.port';

/**
 * TechnicianProfileFacade implements the TechnicianProfilePort of Service Request Management with the
 * Profiles use cases. It exposes only the read-only technician data needed for assignment decisions:
 * identifier, name, speciality, certification and the statistics of the public profile, all read from the
 * public technician directory. Contact data and account identifiers never leave Profiles.
 */
@Injectable({
  providedIn: 'root',
})
export class TechnicianProfileFacade implements TechnicianProfilePort {
  private readonly loadTechnicianDirectoryUseCase = inject(LoadTechnicianDirectoryUseCase);
  private readonly loadTechnicianPublicProfileUseCase = inject(LoadTechnicianPublicProfileUseCase);

  listTechnicians(): Observable<TechnicianSummary[]> {
    return this.loadTechnicianDirectoryUseCase
      .execute()
      .pipe(map((profiles) => profiles.map((profile) => toSummary(profile))));
  }

  listTechnicianCandidates(): Observable<TechnicianCandidate[]> {
    return this.loadTechnicianDirectoryUseCase
      .execute()
      .pipe(map((profiles) => profiles.map((profile) => toCandidate(profile))));
  }

  getTechnicianCandidate(technicianId: number): Observable<TechnicianCandidate> {
    return this.loadTechnicianPublicProfileUseCase
      .execute(technicianId)
      .pipe(map((publicProfile) => toCandidate(publicProfile)));
  }
}

function toSummary(profile: TechnicianPublicProfile): TechnicianSummary {
  return {
    technicianId: profile.id,
    fullName: profile.full_name,
    speciality: profile.speciality,
    certificationNumber: profile.certification_number,
  };
}

function toCandidate(profile: TechnicianPublicProfile): TechnicianCandidate {
  return {
    ...toSummary(profile),
    profileAvailable: true,
    completedServices: profile.completed_services,
    // A technician without reviews has no average, never an average of zero.
    averageRating: profile.rating,
  };
}
