/**
 * KpiResource is one indicator of a COMPLETED report, as the `kpis` array carries it.
 */
export interface KpiResource {
  key: string;
  label: string;
  value: number;
  unit: string;
}

/**
 * ReportResource is returned by `POST /reports`, `GET /reports/{reportId}` and, as summaries, by the paged
 * `GET /reports`. It is serialized `NON_NULL`: absent properties are omitted, so every nullable one is
 * optional.
 *
 * `kpis` is present for a COMPLETED report read by id and omitted in summaries. The web application never
 * reads `result_payload` (the same KPIs encoded in a string) nor `download_url`: links are read from
 * `GET /reports/{reportId}/download-link`.
 */
export interface ReportResource {
  id: number;
  name: string;
  type: string;
  format: string;
  status: string;
  failure_reason?: string | null;
  result_payload?: string | null;
  user_id: number;
  site_id?: number | null;
  equipment_id?: number | null;
  technician_id?: number | null;
  /** Present only for a `SERVICE_INTERVENTION` report. */
  service_request_id?: number | null;
  from: string;
  to: string;
  requested_at: string;
  completed_at?: string | null;
  kpis?: KpiResource[] | null;
}

/**
 * PagedReportResource is returned by `GET /reports` when both `page` and `size` are sent; its items are
 * always summaries.
 */
export interface PagedReportResource {
  content: ReportResource[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/**
 * ReportDownloadLinkResource is returned by `GET /reports/{reportId}/download-link`.
 */
export interface ReportDownloadLinkResource {
  download_url: string;
  expires_at: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
}
