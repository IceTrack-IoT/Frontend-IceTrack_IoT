import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { AlertPolicyPort } from '@monitoring/application/ports/alert-policy.port';
import { MonitoringApiEndpoint } from '@monitoring/infrastructure/api/monitoring-api-endpoint';
import { MonitoringAssembler } from '@monitoring/infrastructure/api/monitoring-assembler';
import { mapMonitoringErrors } from '@monitoring/infrastructure/api/monitoring-error-mapping';

/**
 * AlertPolicyApi implements the AlertPolicyPort with `GET /alert-policies/equipment/{equipmentId}`.
 */
@Injectable({
  providedIn: 'root',
})
export class AlertPolicyApi extends BaseApi implements AlertPolicyPort {
  private readonly endpoint = new MonitoringApiEndpoint(inject(HttpClient));
  private readonly assembler = new MonitoringAssembler();

  getApplicablePolicy(equipmentId: number): Observable<AlertPolicy> {
    return this.endpoint.getApplicablePolicy(equipmentId).pipe(
      mapMonitoringErrors(),
      map((resource) => this.assembler.toAlertPolicyFromResource(resource)),
    );
  }
}
