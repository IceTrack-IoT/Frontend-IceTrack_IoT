import { Injectable } from '@angular/core';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import { OwnerProfileApiEndpoint } from '@profiles/infrastructure/api/owner-profile-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import { TechnicianProfileApiEndpoint } from '@profiles/infrastructure/api/technician-profile-api-endpoint';
import { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';


/**
 * ProfilesApi is a service that provides methods for interacting with the API endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfilesApi extends BaseApi {
  private readonly ownerProfilesEndpoint: OwnerProfileApiEndpoint;
  private readonly technicianProfilesEndpoint: TechnicianProfileApiEndpoint;

  /**
   * Creates an instance of ProfilesApi.
   * @param http - The HttpClient used for making HTTP requests.
   */
  constructor(http: HttpClient) {
    super();
    this.ownerProfilesEndpoint = new OwnerProfileApiEndpoint(http);
    this.technicianProfilesEndpoint = new TechnicianProfileApiEndpoint(http);
  }

  /**
   * Fetches all owner profiles from the API.
   * @returns An Observable that emits an array of OwnerProfile entities.
   */
  getOwnerProfiles(): Observable<OwnerProfile[]> {
    return this.ownerProfilesEndpoint.getAll();
  }

  /**
   * Creates a new owner profile by sending a POST request to the API.
   * @param profile - The OwnerProfile entity to be created.
   * @returns An Observable that emits the created OwnerProfile entity.
   */
  createOwnerProfile(profile: OwnerProfile): Observable<OwnerProfile> {
    return this.ownerProfilesEndpoint.create(profile);
  }

  /**
   * Updates an existing owner profile by sending a PUT request to the API.
   * @param profile - The OwnerProfile entity to be updated.
   * @returns An Observable that emits the updated OwnerProfile entity.
   */
  updateOwnerProfile(profile: OwnerProfile): Observable<OwnerProfile> {
    return this.ownerProfilesEndpoint.update(profile, profile.id);
  }

  /**
   * Deletes an owner profile by sending a DELETE request to the API.
   * @param id - The ID of the OwnerProfile entity to be deleted.
   * @returns An Observable that emits void upon successful deletion.
   */
  deleteOwnerProfile(id: number): Observable<void> {
    return this.ownerProfilesEndpoint.delete(id);
  }

  /**
   * Fetches all technician profiles from the API.
   * @returns An Observable that emits an array of TechnicianProfile entities.
   */
  getTechnicianProfiles(): Observable<TechnicianProfile[]> {
    return this.technicianProfilesEndpoint.getAll();
  }

  /**
   * Creates a new technician profile by sending a POST request to the API.
   * @param profile - The TechnicianProfile entity to be created.
   * @returns An Observable that emits the created TechnicianProfile entity.
   */
  createTechnicianProfile(profile: TechnicianProfile): Observable<TechnicianProfile> {
    return this.technicianProfilesEndpoint.create(profile);
  }

  /**
   * Updates an existing technician profile by sending a PUT request to the API.
   * @param profile - The TechnicianProfile entity to be updated.
   * @returns An Observable that emits the updated TechnicianProfile entity.
   */
  updateTechnicianProfile(profile: TechnicianProfile): Observable<TechnicianProfile> {
    return this.technicianProfilesEndpoint.update(profile, profile.id);
  }

  /**
   * Deletes a technician profile by sending a DELETE request to the API.
   * @param id - The ID of the TechnicianProfile entity to be deleted.
   * @returns An Observable that emits void upon successful deletion.
   */
  deleteTechnicianProfile(id: number): Observable<void> {
    return this.technicianProfilesEndpoint.delete(id);
  }
}
