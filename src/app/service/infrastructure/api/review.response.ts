/**
 * ReviewResource is returned by `POST /reviews`, `PUT /reviews/{reviewId}` and
 * `GET /service-requests/{serviceRequestId}/review`.
 */
export interface ReviewResource {
  id: number;
  service_request_id: number;
  owner_id: number;
  technician_id: number;
  communication: number;
  efficacy: number;
  performance: number;
  /** Mean of the three scores, rounded to two decimals. */
  average_rating: number;
  comment: string | null;
  created_at: string;
  editable_until: string;
}
