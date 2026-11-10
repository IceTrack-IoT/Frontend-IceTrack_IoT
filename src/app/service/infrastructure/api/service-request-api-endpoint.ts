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
  PagedServiceRequestSummaryResource,
  ServiceRequestResource,
} from '@service/infrastructure/api/service-request.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/** The service request list filters and paging, as query parameter values. */
export interface ServiceRequestListParams {
  statuses: readonly string[];
  types: readonly string[];
  priorities: readonly string[];
  equipmentId: number | null;
  page: number;
  size: number;
}

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
   * `GET /service-requests?view=summary&status&type&priority&equipment_id&page&size`: one page of list
   * summaries. Multi-value filters are comma-separated; an empty filter is not sent.
   * @param params - The filters and paging.
   */
  list(params: ServiceRequestListParams): Observable<PagedServiceRequestSummaryResource> {
    let query = new HttpParams()
      .set('view', 'summary')
      .set('page', params.page)
      .set('size', params.size);
    if (params.statuses.length > 0) {
      query = query.set('status', params.statuses.join(','));
    }
    if (params.types.length > 0) {
      query = query.set('type', params.types.join(','));
    }
    if (params.priorities.length > 0) {
      query = query.set('priority', params.priorities.join(','));
    }
    if (params.equipmentId !== null) {
      query = query.set('equipment_id', params.equipmentId);
    }
    return this.http.get<PagedServiceRequestSummaryResource>(this.serviceRequestsUrl, {
      params: query,
    });
  }

  /** `GET /service-requests/{serviceRequestId}` */
  getById(serviceRequestId: number): Observable<ServiceRequestResource> {
    return this.http.get<ServiceRequestResource>(
      withId(this.serviceRequestByIdUrl, '{serviceRequestId}', serviceRequestId),
    );
  }

  /** `PUT /service-requests/{serviceRequestId}/assign` */
  assign(
    serviceRequestId: number,
    request: AssignTechnicianRequest,
  ): Observable<ServiceRequestResource> {
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
    return this.http.put<ReviewResource>(
      withId(this.reviewByIdUrl, '{reviewId}', reviewId),
      request,
    );
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
