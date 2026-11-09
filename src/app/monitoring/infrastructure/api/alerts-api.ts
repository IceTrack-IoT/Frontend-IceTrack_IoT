import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';
import type { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { MonitoringApiEndpoint } from '@monitoring/infrastructure/api/monitoring-api-endpoint';
import { MonitoringAssembler } from '@monitoring/infrastructure/api/monitoring-assembler';
import { mapMonitoringErrors } from '@monitoring/infrastructure/api/monitoring-error-mapping';

/**
 * AlertsApi implements the AlertsPort against the owner alert endpoints of Monitoring and Alerting.
 */
@Injectable({
  providedIn: 'root',
})
export class AlertsApi extends BaseApi implements AlertsPort {
  private readonly endpoint = new MonitoringApiEndpoint(inject(HttpClient));
  private readonly assembler = new MonitoringAssembler();

  getAlert(alertId: number): Observable<Alert> {
    return this.endpoint.getAlert(alertId).pipe(
      mapMonitoringErrors(),
      map((resource) => this.assembler.toAlertFromResource(resource)),
    );
  }

  listActiveAlerts(equipmentId: number): Observable<Alert[]> {
    return this.endpoint.listActiveAlerts(equipmentId).pipe(
      mapMonitoringErrors(),
      map((resources) => resources.map((resource) => this.assembler.toAlertFromResource(resource))),
    );
  }

  acknowledgeAlert(alertId: number): Observable<Alert> {
    return this.endpoint.acknowledgeAlert(alertId).pipe(
      mapMonitoringErrors(),
      map((resource) => this.assembler.toAlertFromResource(resource)),
    );
  }

  resolveAlert(alertId: number): Observable<Alert> {
    return this.endpoint.resolveAlert(alertId).pipe(
      mapMonitoringErrors(),
      map((resource) => this.assembler.toAlertFromResource(resource)),
    );
  }

  dismissAlert(alertId: number, dismissal: AlertDismissal): Observable<Alert> {
    return this.endpoint
      .dismissAlert(alertId, this.assembler.toDismissAlertRequest(dismissal))
      .pipe(
        mapMonitoringErrors(),
        map((resource) => this.assembler.toAlertFromResource(resource)),
      );
  }
}
