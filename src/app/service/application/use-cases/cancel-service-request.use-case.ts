import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Cancels one of the owner's PENDING or ACCEPTED requests with a reason.
 */
@Injectable({
  providedIn: 'root',
})
export class CancelServiceRequestUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param serviceRequestId - The identifier of the service request.
   * @param reason - Why the owner cancels; not blank.
   * @returns An Observable of the canceled service request.
   */
  execute(serviceRequestId: number, reason: string): Observable<ServiceRequest> {
    return this.serviceRequests.cancelServiceRequest(serviceRequestId, reason.trim());
  }
}
