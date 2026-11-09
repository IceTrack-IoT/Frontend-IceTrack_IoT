import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, type Observable, of, switchMap } from 'rxjs';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import { LoadTechnicianProfilesUseCase } from '@profiles/application/use-cases/load-technician-profiles.use-case';
import { LoadTechnicianPublicProfileUseCase } from '@profiles/application/use-cases/load-technician-public-profile.use-case';
import type {
  TechnicianCandidate,
  TechnicianSummary,
} from '@service/application/contracts/technician-candidate';
import type { TechnicianProfilePort } from '@service/application/ports/technician-profile.port';

/**
 * TechnicianProfileFacade implements the TechnicianProfilePort of Service Request Management with the
 * Profiles use cases. It exposes only the read-only technician data needed for assignment decisions:
 * identifier, name, speciality, certification and the statistics of the public profile. Contact data and
 * account identifiers never leave Profiles.
 */
@Injectable({
  providedIn: 'root',
})
export class TechnicianProfileFacade implements TechnicianProfilePort {
  private readonly loadTechnicianProfilesUseCase = inject(LoadTechnicianProfilesUseCase);
  private readonly loadTechnicianPublicProfileUseCase = inject(LoadTechnicianPublicProfileUseCase);

  listTechnicians(): Observable<TechnicianSummary[]> {
    return this.loadTechnicianProfilesUseCase
      .execute()
      .pipe(map((profiles) => profiles.map((profile) => toSummary(profile))));
  }

  listTechnicianCandidates(): Observable<TechnicianCandidate[]> {
    return this.loadTechnicianProfilesUseCase.execute().pipe(
      switchMap((profiles) =>
        profiles.length === 0
          ? of([])
          : forkJoin(
              profiles.map((profile) =>
                this.loadTechnicianPublicProfileUseCase.execute(profile.id).pipe(
                  map((publicProfile) => toCandidate(publicProfile)),
                  // A profile that cannot be read is listed, but cannot be assigned.
                  catchError(() => of(unavailableCandidate(profile))),
                ),
              ),
            ),
      ),
    );
  }

  getTechnicianCandidate(technicianId: number): Observable<TechnicianCandidate> {
    return this.loadTechnicianPublicProfileUseCase
      .execute(technicianId)
      .pipe(map((publicProfile) => toCandidate(publicProfile)));
  }
}

function toSummary(profile: TechnicianProfile): TechnicianSummary {
  return {
    technicianId: profile.id,
    fullName: profile.full_name,
    speciality: profile.speciality,
    certificationNumber: profile.certification_number,
  };
}

function toCandidate(profile: TechnicianPublicProfile): TechnicianCandidate {
  return {
    technicianId: profile.id,
    fullName: profile.full_name,
    speciality: profile.speciality,
    certificationNumber: profile.certification_number,
    profileAvailable: true,
    completedServices: profile.completed_services,
    // A technician without reviews has no average, never an average of zero.
    averageRating: profile.rating,
  };
}

function unavailableCandidate(profile: TechnicianProfile): TechnicianCandidate {
  return {
    ...toSummary(profile),
    profileAvailable: false,
    completedServices: null,
    averageRating: null,
  };
}
