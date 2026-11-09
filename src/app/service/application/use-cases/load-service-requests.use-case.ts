import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ServiceRequestPage,
  ServiceRequestQuery,
} from '@service/application/contracts/service-request-page';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Loads one page of the owner's service requests, optionally filtered by status.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadServiceRequestsUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param query - The status filter and paging.
   * @returns An Observable of the page, newest first.
   */
  execute(query: ServiceRequestQuery): Observable<ServiceRequestPage> {
    return this.serviceRequests.listServiceRequests(query);
  }
}
