import { type HttpClient, HttpParams, type HttpResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { DismissAlertRequest } from '@monitoring/infrastructure/api/monitoring.requests';
import type {
  AlertPolicyResource,
  AlertResource,
  DashboardSummaryResource,
  PagedAlertResource,
  SensorReadingResource,
  StreamTicketResource,
  TelemetryBucketResource,
} from '@monitoring/infrastructure/api/monitoring.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/** The alert list filters and paging, as query parameter values. */
export interface AlertListParams {
  statuses: readonly string[];
  severities: readonly string[];
  types: readonly string[];
  equipmentId: number | null;
  page: number;
  size: number;
}

/**
 * MonitoringApiEndpoint sends the owner requests of the `AlertsController`, `AlertPoliciesController`,
 * `TelemetryController`, `TelemetryStreamController` and `DashboardSummaryController`.
 */
export class MonitoringApiEndpoint {
  private readonly alertsUrl = `${baseUrl}${environment.iceTrackProviderAlertsEndpointPath}`;
  private readonly dashboardSummaryUrl = `${baseUrl}${environment.iceTrackProviderDashboardSummaryEndpointPath}`;
  private readonly alertByIdUrl = `${baseUrl}${environment.iceTrackProviderAlertByIdEndpointPath}`;
  private readonly activeAlertsUrl = `${baseUrl}${environment.iceTrackProviderActiveAlertsByEquipmentEndpointPath}`;
  private readonly acknowledgeUrl = `${baseUrl}${environment.iceTrackProviderAcknowledgeAlertEndpointPath}`;
  private readonly resolveUrl = `${baseUrl}${environment.iceTrackProviderResolveAlertEndpointPath}`;
  private readonly dismissUrl = `${baseUrl}${environment.iceTrackProviderDismissAlertEndpointPath}`;
  private readonly policyUrl = `${baseUrl}${environment.iceTrackProviderAlertPolicyByEquipmentEndpointPath}`;
  private readonly historyUrl = `${baseUrl}${environment.iceTrackProviderReadingHistoryEndpointPath}`;
  private readonly streamTicketUrl = `${baseUrl}${environment.iceTrackProviderTelemetryStreamTicketEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /alerts/{alertId}` */
  getAlert(alertId: number): Observable<AlertResource> {
    return this.http.get<AlertResource>(withId(this.alertByIdUrl, '{alertId}', alertId));
  }

  /**
   * `GET /alerts?status&severity&type&equipment_id&page&size`: one page of the owner's alerts. Multi-value
   * filters are comma-separated; an empty filter is not sent.
   */
  listAlerts(params: AlertListParams): Observable<PagedAlertResource> {
    let query = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.statuses.length > 0) {
      query = query.set('status', params.statuses.join(','));
    }
    if (params.severities.length > 0) {
      query = query.set('severity', params.severities.join(','));
    }
    if (params.types.length > 0) {
      query = query.set('type', params.types.join(','));
    }
    if (params.equipmentId !== null) {
      query = query.set('equipment_id', params.equipmentId);
    }
    return this.http.get<PagedAlertResource>(this.alertsUrl, { params: query });
  }

  /** `GET /dashboard/summary` for every site of the owner. */
  getDashboardSummary(): Observable<DashboardSummaryResource> {
    return this.http.get<DashboardSummaryResource>(this.dashboardSummaryUrl);
  }

  /** `GET /alerts/equipment/{equipmentId}/open`: the OPEN and ACKNOWLEDGED alerts of the unit. */
  listActiveAlerts(equipmentId: number): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(
      withId(this.activeAlertsUrl, '{equipmentId}', equipmentId),
    );
  }

  /** `PUT /alerts/{alertId}/acknowledge` */
  acknowledgeAlert(alertId: number): Observable<AlertResource> {
    return this.http.put<AlertResource>(withId(this.acknowledgeUrl, '{alertId}', alertId), null);
  }

  /** `PUT /alerts/{alertId}/resolve` */
  resolveAlert(alertId: number): Observable<AlertResource> {
    return this.http.put<AlertResource>(withId(this.resolveUrl, '{alertId}', alertId), null);
  }

  /** `PUT /alerts/{alertId}/dismiss` */
  dismissAlert(alertId: number, request: DismissAlertRequest): Observable<AlertResource> {
    return this.http.put<AlertResource>(withId(this.dismissUrl, '{alertId}', alertId), request);
  }

  /** `GET /alert-policies/equipment/{equipmentId}` */
  getApplicablePolicy(equipmentId: number): Observable<AlertPolicyResource> {
    return this.http.get<AlertPolicyResource>(withId(this.policyUrl, '{equipmentId}', equipmentId));
  }

  /** `GET /telemetry/equipment/{equipmentId}?from&to`, with both instants in UTC (`Z`). */
  getReadingHistory(
    equipmentId: number,
    from: Date,
    to: Date,
  ): Observable<SensorReadingResource[]> {
    const params = new HttpParams().set('from', from.toISOString()).set('to', to.toISOString());
    return this.http.get<SensorReadingResource[]>(
      withId(this.historyUrl, '{equipmentId}', equipmentId),
      { params },
    );
  }

  /**
   * `GET /telemetry/equipment/{equipmentId}?from&to&bucket=auto`: the batches aggregated into buckets of
   * the width the backend chooses, named by the `X-Telemetry-Bucket` response header.
   */
  getBucketedHistory(
    equipmentId: number,
    from: Date,
    to: Date,
  ): Observable<HttpResponse<TelemetryBucketResource[]>> {
    const params = new HttpParams()
      .set('from', from.toISOString())
      .set('to', to.toISOString())
      .set('bucket', 'auto');
    return this.http.get<TelemetryBucketResource[]>(
      withId(this.historyUrl, '{equipmentId}', equipmentId),
      { params, observe: 'response' },
    );
  }

  /** `POST /telemetry/stream-ticket` (no body) */
  issueStreamTicket(): Observable<StreamTicketResource> {
    return this.http.post<StreamTicketResource>(this.streamTicketUrl, null);
  }
}

function withId(url: string, placeholder: string, id: number): string {
  return url.replace(placeholder, encodeURIComponent(String(id)));
}
