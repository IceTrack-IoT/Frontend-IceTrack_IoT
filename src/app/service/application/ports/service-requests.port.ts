import type { Observable } from 'rxjs';
import type { Intervention } from '@service/domain/model/intervention.entity';
import type { Review } from '@service/domain/model/review.entity';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import type { NewServiceRequest } from '@service/application/contracts/new-service-request';
import type { ReviewScores } from '@service/application/contracts/review-scores';
import type {
  ServiceRequestPage,
  ServiceRequestQuery,
} from '@service/application/contracts/service-request-page';

/**
 * ServiceRequestsPort is the outbound port used by Service Request Management use cases to run the owner
 * operations of the backend: create, list, read, assign, cancel, interventions and reviews.
 *
 * Definitive backend rejections (any 4xx answer) are reported as ServiceRequestsError; any other error is
 * transient. Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ServiceRequestsPort {
  /**
   * Creates a service request for an equipment item of the owner. It starts PENDING without a technician.
   * Fails with `VALIDATION_ERROR` or `NOT_FOUND` (equipment not reachable).
   * @param request - The data of the new request.
   * @returns An Observable of the created service request.
   */
  abstract createServiceRequest(request: NewServiceRequest): Observable<ServiceRequest>;

  /**
   * Lists one page of the owner's service requests, newest first.
   * Fails with `VALIDATION_ERROR` for an invalid filter or page.
   * @param query - The status filter and paging.
   * @returns An Observable of the page.
   */
  abstract listServiceRequests(query: ServiceRequestQuery): Observable<ServiceRequestPage>;

  /**
   * Retrieves a service request with its status history, intervention and maintenance windows.
   * Fails with `NOT_FOUND` when the request does not exist or is not the owner's.
   * @param serviceRequestId - The identifier of the service request.
   * @returns An Observable of the service request.
   */
  abstract getServiceRequest(serviceRequestId: number): Observable<ServiceRequest>;

  /**
   * Assigns a technician to a PENDING or ACCEPTED request, replacing the current one. The request goes
   * back to PENDING until the technician accepts it.
   * Fails with `NOT_FOUND`, `TECHNICIAN_NOT_ELIGIBLE`, `INVALID_STATUS_TRANSITION` or
   * `CONCURRENT_MODIFICATION_CONFLICT`.
   * @param serviceRequestId - The identifier of the service request.
   * @param technicianId - The identifier of the technician profile.
   * @returns An Observable of the updated service request.
   */
  abstract assignTechnician(
    serviceRequestId: number,
    technicianId: number,
  ): Observable<ServiceRequest>;

  /**
   * Cancels a PENDING or ACCEPTED request.
   * Fails with `VALIDATION_ERROR` (missing reason), `NOT_FOUND`, `INVALID_STATUS_TRANSITION` or
   * `CONCURRENT_MODIFICATION_CONFLICT`.
   * @param serviceRequestId - The identifier of the service request.
   * @param reason - Why the owner cancels; not blank, up to 500 characters.
   * @returns An Observable of the canceled service request.
   */
  abstract cancelServiceRequest(serviceRequestId: number, reason: string): Observable<ServiceRequest>;

  /**
   * Lists the interventions that completed service requests on an equipment item, most recent first.
   * Fails with `NOT_FOUND` when the equipment is not reachable.
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the interventions.
   */
  abstract getEquipmentInterventions(equipmentId: number): Observable<Intervention[]>;

  /**
   * Retrieves the review of a service request.
   * @param serviceRequestId - The identifier of the service request.
   * @returns An Observable of the review, or of null when the request has no review reachable by the
   * owner.
   */
  abstract getReview(serviceRequestId: number): Observable<Review | null>;

  /**
   * Reviews the technician who completed one of the owner's requests.
   * Fails with `VALIDATION_ERROR`, `NOT_FOUND`, `REVIEW_NOT_ALLOWED` (request not completed) or
   * `DUPLICATE_RESOURCE_CONFLICT` (already reviewed).
   * @param serviceRequestId - The identifier of the completed service request.
   * @param scores - The scores and optional comment.
   * @returns An Observable of the submitted review.
   */
  abstract submitReview(serviceRequestId: number, scores: ReviewScores): Observable<Review>;

  /**
   * Replaces the scores and comment of one of the owner's reviews, within its edit window.
   * Fails with `VALIDATION_ERROR`, `NOT_FOUND` or `REVIEW_NOT_ALLOWED` (the edit window has closed).
   * @param reviewId - The identifier of the review.
   * @param scores - The new scores and optional comment.
   * @returns An Observable of the updated review.
   */
  abstract updateReview(reviewId: number, scores: ReviewScores): Observable<Review>;
}
