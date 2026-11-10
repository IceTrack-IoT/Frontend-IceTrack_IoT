import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Review } from '@service/domain/model/review.entity';
import {
  normalizeReviewScores,
  type ReviewScores,
} from '@service/application/contracts/review-scores';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Replaces the scores and comment of one of the owner's reviews. The backend decides whether the edit
 * window is still open.
 */
@Injectable({
  providedIn: 'root',
})
export class UpdateServiceReviewUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param reviewId - The identifier of the review.
   * @param scores - The new scores and optional comment.
   * @returns An Observable of the updated review.
   */
  execute(reviewId: number, scores: ReviewScores): Observable<Review> {
    return this.serviceRequests.updateReview(reviewId, normalizeReviewScores(scores));
  }
}
