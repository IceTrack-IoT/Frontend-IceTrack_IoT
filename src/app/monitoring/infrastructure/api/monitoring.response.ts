/**
 * AlertResource is returned by the alert endpoints of `AlertsController`. Nullable properties are written
 * as `null`; they are typed optional as well so a missing one is read as null.
 */
export interface AlertResource {
  id: number;
  equipment_id: number;
  type: string;
  severity: string;
  status: string;
  triggering_reading_id?: number | null;
  triggering_temperature?: number | null;
  triggering_recorded_at?: string | null;
  peak_temperature?: number | null;
  opened_at: string;
  acknowledged_by?: number | null;
  acknowledged_at?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  dismissed_by?: number | null;
  dismissed_at?: string | null;
  dismiss_reason?: string | null;
  dismiss_evidence?: string | null;
  total_duration_seconds?: number | null;
}

/**
 * AlertPolicyResource is returned by `GET /alert-policies/equipment/{equipmentId}`; `equipment_id` is null
 * for the platform-wide default policy.
 */
export interface AlertPolicyResource {
  id: number;
  equipment_id?: number | null;
  sustained_excursion_minutes: number;
  hysteresis_margin_celsius: number;
  missed_sync_windows_for_offline: number;
  active: boolean;
}

/**
 * SensorReadingResource is returned, as a JSON array, by `GET /telemetry/equipment/{equipmentId}`. Only
 * the properties the web application reads are declared.
 */
export interface SensorReadingResource {
  id: number;
  reading_uid: string;
  equipment_id: number;
  device_id: number;
  min_temperature: number;
  max_temperature: number;
  avg_temperature: number;
  humidity: number;
  sample_count: number;
  recorded_at: string;
  under_maintenance: boolean;
}

/**
 * TelemetryBucketResource is returned, as a JSON array oldest first, by
 * `GET /telemetry/equipment/{equipmentId}` with `bucket`. Empty buckets are omitted.
 */
export interface TelemetryBucketResource {
  bucket_start: string;
  bucket_end: string;
  min_temperature: number;
  max_temperature: number;
  avg_temperature: number;
  avg_humidity?: number | null;
  sample_count: number;
  batch_count: number;
  under_maintenance: boolean;
  door_open_seconds?: number | null;
  last_received_at: string;
}

/**
 * PagedAlertResource is returned by `GET /alerts`, which is always paged.
 */
export interface PagedAlertResource {
  content: AlertResource[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/**
 * DashboardSummaryResource is returned by `GET /dashboard/summary`. Every status and severity key is
 * present, 0 when nothing holds it. Only the properties the web application reads are declared.
 */
export interface DashboardSummaryResource {
  generated_at: string;
  site_count: number;
  equipment: {
    total: number;
    reporting: number;
    silent: number;
    never_reported: number;
  };
  alerts: {
    open: number;
    acknowledged: number;
    active_by_severity: Record<string, number>;
  };
  service_requests: {
    active: number;
  };
}

/**
 * StreamTicketResource is returned by `POST /telemetry/stream-ticket`: a single-use ticket to open the
 * telemetry stream.
 */
export interface StreamTicketResource {
  ticket: string;
  expires_in: number;
}
