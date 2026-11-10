import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import type { NewServiceRequest } from '@service/application/contracts/new-service-request';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Creates a preventive maintenance or repair request for one of the owner's equipment items. It is never
 * triggered automatically: the owner confirms every request, including drafts started from an alert.
 */
@Injectable({
  providedIn: 'root',
})
export class CreateServiceRequestUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param request - The data of the new request.
   * @returns An Observable of the created request, PENDING and without a technician.
   */
  execute(request: NewServiceRequest): Observable<ServiceRequest> {
    return this.serviceRequests.createServiceRequest({
      ...request,
      description: request.description.trim(),
    });
  }
}
