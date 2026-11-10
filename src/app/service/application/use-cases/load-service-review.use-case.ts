import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Review } from '@service/domain/model/review.entity';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Loads the owner's review of a service request, if there is one.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadServiceReviewUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param serviceRequestId - The identifier of the service request.
   * @returns An Observable of the review, or of null when the request has none.
   */
  execute(serviceRequestId: number): Observable<Review | null> {
    return this.serviceRequests.getReview(serviceRequestId);
  }
}
