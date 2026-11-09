import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { LoadServiceRequestsUseCase } from '@service/application/use-cases/load-service-requests.use-case';
import type { ActiveServiceRequestCountPort } from '@monitoring/application/ports/active-service-request-count.port';

/** The statuses of a service request that is not finished: neither completed nor canceled. */
const ACTIVE_STATUSES: readonly ServiceStatus[] = [
  ServiceStatus.PENDING,
  ServiceStatus.ACCEPTED,
  ServiceStatus.IN_PROGRESS,
];

/**
 * ActiveServiceRequestCountFacade implements the ActiveServiceRequestCountPort of Monitoring and Alerting
 * with the Service Request Management use cases. Only the number of the owner's active requests crosses
 * the boundary; it is read from the total of a one-item page filtered by status.
 */
@Injectable({
  providedIn: 'root',
})
export class ActiveServiceRequestCountFacade implements ActiveServiceRequestCountPort {
  private readonly loadServiceRequestsUseCase = inject(LoadServiceRequestsUseCase);

  countActiveServiceRequests(): Observable<number> {
    return this.loadServiceRequestsUseCase
      .execute({ statuses: ACTIVE_STATUSES, page: 0, size: 1 })
      .pipe(map((page) => page.totalElements));
  }
}
