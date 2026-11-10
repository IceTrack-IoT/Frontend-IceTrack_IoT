import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Assigns a technician to one of the owner's PENDING or ACCEPTED requests, replacing the current one. The
 * request goes back to PENDING until the technician accepts it.
 */
@Injectable({
  providedIn: 'root',
})
export class AssignTechnicianUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param serviceRequestId - The identifier of the service request.
   * @param technicianId - The identifier of the technician profile.
   * @returns An Observable of the updated service request.
   */
  execute(serviceRequestId: number, technicianId: number): Observable<ServiceRequest> {
    return this.serviceRequests.assignTechnician(serviceRequestId, technicianId);
  }
}
