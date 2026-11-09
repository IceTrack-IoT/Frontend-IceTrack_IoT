import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { ReviewResource } from '@service/infrastructure/api/review.response';
import type {
  AssignTechnicianRequest,
  CancelServiceRequestRequest,
  CreateServiceRequestRequest,
  SubmitReviewRequest,
  UpdateReviewRequest,
} from '@service/infrastructure/api/service-request.requests';
import type {
  InterventionResource,
  PagedServiceRequestResource,
  ServiceRequestResource,
} from '@service/infrastructure/api/service-request.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/**
 * ServiceRequestApiEndpoint sends the owner requests of the `ServiceRequestsController`,
 * `ReviewsController` and `EquipmentInterventionsController`.
 */
export class ServiceRequestApiEndpoint {
  private readonly serviceRequestsUrl = `${baseUrl}${environment.iceTrackProviderServiceRequestsEndpointPath}`;
  private readonly serviceRequestByIdUrl = `${baseUrl}${environment.iceTrackProviderServiceRequestByIdEndpointPath}`;
  private readonly assignUrl = `${baseUrl}${environment.iceTrackProviderAssignTechnicianEndpointPath}`;
  private readonly cancelUrl = `${baseUrl}${environment.iceTrackProviderCancelServiceRequestEndpointPath}`;
  private readonly requestReviewUrl = `${baseUrl}${environment.iceTrackProviderServiceRequestReviewEndpointPath}`;
  private readonly reviewsUrl = `${baseUrl}${environment.iceTrackProviderReviewsEndpointPath}`;
  private readonly reviewByIdUrl = `${baseUrl}${environment.iceTrackProviderReviewByIdEndpointPath}`;
  private readonly interventionsUrl = `${baseUrl}${environment.iceTrackProviderEquipmentInterventionsEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /service-requests` */
  create(request: CreateServiceRequestRequest): Observable<ServiceRequestResource> {
    return this.http.post<ServiceRequestResource>(this.serviceRequestsUrl, request);
  }

  /**
   * `GET /service-requests?status&page&size`
   * @param statuses - The statuses to keep, sent comma-separated; none sends no filter.
   * @param page - The zero-based page index.
   * @param size - The page size, from 1 to 100.
   */
  list(statuses: readonly string[], page: number, size: number): Observable<PagedServiceRequestResource> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (statuses.length > 0) {
      params = params.set('status', statuses.join(','));
    }
    return this.http.get<PagedServiceRequestResource>(this.serviceRequestsUrl, { params });
  }

  /** `GET /service-requests/{serviceRequestId}` */
  getById(serviceRequestId: number): Observable<ServiceRequestResource> {
    return this.http.get<ServiceRequestResource>(
      withId(this.serviceRequestByIdUrl, '{serviceRequestId}', serviceRequestId),
    );
  }

  /** `PUT /service-requests/{serviceRequestId}/assign` */
  assign(serviceRequestId: number, request: AssignTechnicianRequest): Observable<ServiceRequestResource> {
    return this.http.put<ServiceRequestResource>(
      withId(this.assignUrl, '{serviceRequestId}', serviceRequestId),
      request,
    );
  }

  /** `PUT /service-requests/{serviceRequestId}/cancel` */
  cancel(
    serviceRequestId: number,
    request: CancelServiceRequestRequest,
  ): Observable<ServiceRequestResource> {
    return this.http.put<ServiceRequestResource>(
      withId(this.cancelUrl, '{serviceRequestId}', serviceRequestId),
      request,
    );
  }

  /** `GET /service-requests/{serviceRequestId}/review` */
  getReview(serviceRequestId: number): Observable<ReviewResource> {
    return this.http.get<ReviewResource>(
      withId(this.requestReviewUrl, '{serviceRequestId}', serviceRequestId),
    );
  }

  /** `POST /reviews` */
  submitReview(request: SubmitReviewRequest): Observable<ReviewResource> {
    return this.http.post<ReviewResource>(this.reviewsUrl, request);
  }

  /** `PUT /reviews/{reviewId}` */
  updateReview(reviewId: number, request: UpdateReviewRequest): Observable<ReviewResource> {
    return this.http.put<ReviewResource>(withId(this.reviewByIdUrl, '{reviewId}', reviewId), request);
  }

  /** `GET /assets/equipments/{equipmentId}/interventions` */
  getEquipmentInterventions(equipmentId: number): Observable<InterventionResource[]> {
    return this.http.get<InterventionResource[]>(
      withId(this.interventionsUrl, '{equipmentId}', equipmentId),
    );
  }
}

function withId(url: string, placeholder: string, id: number): string {
  return url.replace(placeholder, encodeURIComponent(String(id)));
}
