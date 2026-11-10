import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import type { TechnicianPublicProfilePage } from '@profiles/application/contracts/technician-public-profile-page';
import type { OwnerProfileUpdate } from '@profiles/application/contracts/owner-profile-update';
import type { ProfilesPort } from '@profiles/application/ports/profiles.port';
import { OwnerProfileApiEndpoint } from '@profiles/infrastructure/api/owner-profile-api-endpoint';
import { OwnerProfileAssembler } from '@profiles/infrastructure/api/owner-profile-assembler';
import { mapProfilesErrors } from '@profiles/infrastructure/api/profiles-error-mapping';
import { TechnicianProfileApiEndpoint } from '@profiles/infrastructure/api/technician-profile-api-endpoint';
import { TechnicianProfileAssembler } from '@profiles/infrastructure/api/technician-profile-assembler';

/**
 * ProfilesApi implements the ProfilesPort against the owner and technician profile endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfilesApi extends BaseApi implements ProfilesPort {
  private readonly http = inject(HttpClient);
  private readonly ownerProfilesEndpoint = new OwnerProfileApiEndpoint(this.http);
  private readonly technicianProfilesEndpoint = new TechnicianProfileApiEndpoint(this.http);
  private readonly ownerProfileAssembler = new OwnerProfileAssembler();
  private readonly technicianProfileAssembler = new TechnicianProfileAssembler();

  getOwnerProfileByUserId(userId: number): Observable<OwnerProfile> {
    return this.ownerProfilesEndpoint.getByUserId(userId).pipe(
      map((resource) => this.ownerProfileAssembler.toEntityFromResource(resource)),
      mapProfilesErrors(),
    );
  }

  updateOwnerProfile(ownerId: number, update: OwnerProfileUpdate): Observable<OwnerProfile> {
    return this.ownerProfilesEndpoint
      .update(ownerId, this.ownerProfileAssembler.toRequestFromUpdate(update))
      .pipe(
        map((resource) => this.ownerProfileAssembler.toEntityFromResource(resource)),
        mapProfilesErrors(),
      );
  }

  getTechnicianProfiles(): Observable<TechnicianProfile[]> {
    return this.technicianProfilesEndpoint.getAll().pipe(
      map((resources) =>
        resources.map((resource) => this.technicianProfileAssembler.toEntityFromResource(resource)),
      ),
      mapProfilesErrors(),
    );
  }

  listTechnicianPublicProfiles(
    page: number,
    size: number,
  ): Observable<TechnicianPublicProfilePage> {
    return this.technicianProfilesEndpoint.getPublicDirectory(page, size).pipe(
      map((resource) => ({
        items: resource.content.map((item) =>
          this.technicianProfileAssembler.toPublicProfileFromResource(item),
        ),
        page: resource.page,
        size: resource.size,
        totalElements: resource.total_elements,
        totalPages: resource.total_pages,
      })),
      mapProfilesErrors(),
    );
  }

  getTechnicianPublicProfile(technicianId: number): Observable<TechnicianPublicProfile> {
    return this.technicianProfilesEndpoint.getPublicProfile(technicianId).pipe(
      map((resource) => this.technicianProfileAssembler.toPublicProfileFromResource(resource)),
      mapProfilesErrors(),
    );
  }
}
