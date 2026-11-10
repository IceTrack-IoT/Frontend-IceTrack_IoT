/**
 * StatusTransitionResource is one entry of `ServiceRequestResource.history`.
 */
export interface StatusTransitionResource {
  /** Null for the creation. */
  from_status: string | null;
  to_status: string;
  actor_id: number;
  occurred_at: string;
  reason: string | null;
  technician_id: number | null;
}

/**
 * InterventionResource is returned by `GET /assets/equipments/{equipmentId}/interventions` (a plain JSON
 * array) and embedded in `ServiceRequestResource.intervention`.
 */
export interface InterventionResource {
  service_request_id: number;
  client_generated_id: string;
  technician_id: number;
  equipment_id: number;
  diagnosis: string;
  actions_taken: string;
  spare_parts: string[] | null;
  photo_evidence: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

/**
 * MaintenanceWindowLinkResource is one entry of `ServiceRequestResource.maintenance_windows`.
 */
export interface MaintenanceWindowLinkResource {
  window_id: number;
  origin: string;
  technician_id: number | null;
  started_at: string;
  ended_at: string | null;
  closure_reason: string | null;
}

/**
 * ServiceRequestResource is the central response of the service request endpoints. Only `edge_grant`,
 * present solely in the technician's accept response, is omitted: owners never receive it, and this
 * client neither reads nor keeps it.
 */
export interface ServiceRequestResource {
  id: number;
  owner_id: number;
  equipment_id: number;
  site_id: number;
  technician_id: number | null;
  type: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  history: StatusTransitionResource[] | null;
  intervention: InterventionResource | null;
  maintenance_windows: MaintenanceWindowLinkResource[] | null;
  equipment_name?: string | null;
  site_name?: string | null;
  technician_name?: string | null;
  source_alert_id?: number | null;
}

/**
 * ServiceRequestSummaryResource is an item of `GET /service-requests?view=summary`: the request without its
 * history, intervention details or maintenance windows.
 */
export interface ServiceRequestSummaryResource {
  id: number;
  equipment_id: number;
  site_id: number;
  technician_id: number | null;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  equipment_name?: string | null;
  site_name?: string | null;
  technician_name?: string | null;
  has_intervention: boolean;
  has_review: boolean;
  source_alert_id?: number | null;
}

/**
 * PagedServiceRequestSummaryResource is returned by `GET /service-requests?view=summary`.
 */
export interface PagedServiceRequestSummaryResource {
  content: ServiceRequestSummaryResource[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}
