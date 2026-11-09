import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Loads one of the owner's service requests with its status history, intervention and maintenance
 * windows.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadServiceRequestUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param serviceRequestId - The identifier of the service request.
   * @returns An Observable of the service request.
   */
  execute(serviceRequestId: number): Observable<ServiceRequest> {
    return this.serviceRequests.getServiceRequest(serviceRequestId);
  }
}
