/**
 * Request bodies of the owner operations of Service Request Management, with their serialized
 * (`snake_case`) property names.
 */

/** CreateServiceRequestResource, sent by `POST /service-requests`. */
export interface CreateServiceRequestRequest {
  equipment_id: number;
  type: string;
  priority: string;
  description: string;
}

/** AssignTechnicianResource, sent by `PUT /service-requests/{serviceRequestId}/assign`. */
export interface AssignTechnicianRequest {
  technician_profile_id: number;
}

/** CancelServiceRequestResource, sent by `PUT /service-requests/{serviceRequestId}/cancel`. */
export interface CancelServiceRequestRequest {
  reason: string;
}

/** UpdateReviewResource, sent by `PUT /reviews/{reviewId}`. */
export interface UpdateReviewRequest {
  communication: number;
  efficacy: number;
  performance: number;
  comment: string | null;
}

/** SubmitReviewResource, sent by `POST /reviews`. */
export interface SubmitReviewRequest extends UpdateReviewRequest {
  service_request_id: number;
}
