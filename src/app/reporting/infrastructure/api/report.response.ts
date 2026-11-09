/**
 * ReportResource is returned by `POST /reports`, `GET /reports/{reportId}` and, as a JSON array,
 * `GET /reports`. It is serialized `NON_NULL`: absent properties are omitted, so every nullable one is
 * optional.
 *
 * `result_payload` is a JSON array of KPIs encoded inside a string (`[{"label","value","unit"}]`), present
 * once COMPLETED. `download_url` is a signed link valid for 15 minutes, present for a COMPLETED report.
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
  from: string;
  to: string;
  requested_at: string;
  completed_at?: string | null;
  download_url?: string | null;
}
