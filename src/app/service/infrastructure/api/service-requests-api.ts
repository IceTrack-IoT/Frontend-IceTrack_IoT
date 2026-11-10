import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, of, throwError } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Intervention } from '@service/domain/model/intervention.entity';
import type { Review } from '@service/domain/model/review.entity';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import type { NewServiceRequest } from '@service/application/contracts/new-service-request';
import type { ReviewScores } from '@service/application/contracts/review-scores';
import type {
  ServiceRequestPage,
  ServiceRequestQuery,
} from '@service/application/contracts/service-request-page';
import type { ServiceRequestsPort } from '@service/application/ports/service-requests.port';
import { ServiceRequestApiEndpoint } from '@service/infrastructure/api/service-request-api-endpoint';
import { ServiceRequestAssembler } from '@service/infrastructure/api/service-request-assembler';
import { mapServiceRequestsErrors } from '@service/infrastructure/api/service-requests-error-mapping';

/**
 * ServiceRequestsApi implements the ServiceRequestsPort against the owner endpoints of Service Request
 * Management.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceRequestsApi extends BaseApi implements ServiceRequestsPort {
  private readonly endpoint = new ServiceRequestApiEndpoint(inject(HttpClient));
  private readonly assembler = new ServiceRequestAssembler();

  createServiceRequest(request: NewServiceRequest): Observable<ServiceRequest> {
    return this.endpoint.create(this.assembler.toCreateRequest(request)).pipe(
      mapServiceRequestsErrors(),
      map((resource) => this.assembler.toEntityFromResource(resource)),
    );
  }

  listServiceRequests(query: ServiceRequestQuery): Observable<ServiceRequestPage> {
    return this.endpoint.list(query).pipe(
      mapServiceRequestsErrors(),
      map((resource) => this.assembler.toPageFromResource(resource)),
    );
  }

  getServiceRequest(serviceRequestId: number): Observable<ServiceRequest> {
    return this.endpoint.getById(serviceRequestId).pipe(
      mapServiceRequestsErrors(),
      map((resource) => this.assembler.toEntityFromResource(resource)),
    );
  }

  assignTechnician(serviceRequestId: number, technicianId: number): Observable<ServiceRequest> {
    return this.endpoint.assign(serviceRequestId, { technician_profile_id: technicianId }).pipe(
      mapServiceRequestsErrors(),
      map((resource) => this.assembler.toEntityFromResource(resource)),
    );
  }

  cancelServiceRequest(serviceRequestId: number, reason: string): Observable<ServiceRequest> {
    return this.endpoint.cancel(serviceRequestId, { reason }).pipe(
      mapServiceRequestsErrors(),
      map((resource) => this.assembler.toEntityFromResource(resource)),
    );
  }

  getEquipmentInterventions(equipmentId: number): Observable<Intervention[]> {
    return this.endpoint.getEquipmentInterventions(equipmentId).pipe(
      mapServiceRequestsErrors(),
      map((resources) =>
        resources.map((resource) => this.assembler.toInterventionFromResource(resource)),
      ),
    );
  }

  getReview(serviceRequestId: number): Observable<Review | null> {
    return this.endpoint.getReview(serviceRequestId).pipe(
      map((resource): Review | null => this.assembler.toReviewFromResource(resource)),
      // A request without a review answers 404.
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
      mapServiceRequestsErrors(),
    );
  }

  submitReview(serviceRequestId: number, scores: ReviewScores): Observable<Review> {
    return this.endpoint
      .submitReview({
        service_request_id: serviceRequestId,
        ...this.assembler.toReviewRequest(scores),
      })
      .pipe(
        mapServiceRequestsErrors(),
        map((resource) => this.assembler.toReviewFromResource(resource)),
      );
  }

  updateReview(reviewId: number, scores: ReviewScores): Observable<Review> {
    return this.endpoint.updateReview(reviewId, this.assembler.toReviewRequest(scores)).pipe(
      mapServiceRequestsErrors(),
      map((resource) => this.assembler.toReviewFromResource(resource)),
    );
  }
}
