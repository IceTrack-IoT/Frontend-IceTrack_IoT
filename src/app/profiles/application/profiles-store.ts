import { Injectable, signal } from '@angular/core';
import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import { Observable } from 'rxjs';
import { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import { ProfilesApi } from '@profiles/infrastructure/api/profiles-api';

@Injectable({
  providedIn: 'root',
})
export class ProfilesStore {
  private ownerProfilesSignal = signal<OwnerProfile[]>([]);
  readonly ownerProfiles = this.ownerProfilesSignal.asReadonly();
  private technicianProfiles = signal<TechnicianProfile[]>([]);
  readonly technicianProfilesSignal = this.technicianProfiles.asReadonly();

  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly  errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();


  constructor(profilesApi: ProfilesApi) {
  }
}
