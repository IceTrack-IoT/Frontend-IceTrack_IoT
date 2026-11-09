import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Review } from '@service/domain/model/review.entity';
import {
  normalizeReviewScores,
  type ReviewScores,
} from '@service/application/contracts/review-scores';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Reviews the technician who completed one of the owner's service requests.
 */
@Injectable({
  providedIn: 'root',
})
export class SubmitServiceReviewUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param serviceRequestId - The identifier of the completed service request.
   * @param scores - The scores and optional comment.
   * @returns An Observable of the submitted review.
   */
  execute(serviceRequestId: number, scores: ReviewScores): Observable<Review> {
    return this.serviceRequests.submitReview(serviceRequestId, normalizeReviewScores(scores));
  }
}
