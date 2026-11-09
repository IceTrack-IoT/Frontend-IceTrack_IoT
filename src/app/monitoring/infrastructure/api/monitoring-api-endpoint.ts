import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { DismissAlertRequest } from '@monitoring/infrastructure/api/monitoring.requests';
import type {
  AlertPolicyResource,
  AlertResource,
  SensorReadingResource,
  StreamTicketResource,
} from '@monitoring/infrastructure/api/monitoring.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/**
 * MonitoringApiEndpoint sends the owner requests of the `AlertsController`, `AlertPoliciesController`,
 * `TelemetryController` and `TelemetryStreamController`.
 */
export class MonitoringApiEndpoint {
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

  /** `POST /telemetry/stream-ticket` (no body) */
  issueStreamTicket(): Observable<StreamTicketResource> {
    return this.http.post<StreamTicketResource>(this.streamTicketUrl, null);
  }
}

function withId(url: string, placeholder: string, id: number): string {
  return url.replace(placeholder, encodeURIComponent(String(id)));
}
