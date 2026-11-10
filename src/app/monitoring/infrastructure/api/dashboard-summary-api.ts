import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { DashboardSummary } from '@monitoring/application/contracts/dashboard-summary';
import type { DashboardSummaryPort } from '@monitoring/application/ports/dashboard-summary.port';
import { MonitoringApiEndpoint } from '@monitoring/infrastructure/api/monitoring-api-endpoint';
import { MonitoringAssembler } from '@monitoring/infrastructure/api/monitoring-assembler';
import { mapMonitoringErrors } from '@monitoring/infrastructure/api/monitoring-error-mapping';

/**
 * DashboardSummaryApi implements the DashboardSummaryPort with `GET /dashboard/summary`.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardSummaryApi extends BaseApi implements DashboardSummaryPort {
  private readonly endpoint = new MonitoringApiEndpoint(inject(HttpClient));
  private readonly assembler = new MonitoringAssembler();

  getSummary(): Observable<DashboardSummary> {
    return this.endpoint.getDashboardSummary().pipe(
      mapMonitoringErrors(),
      map((resource) => this.assembler.toDashboardSummaryFromResource(resource)),
    );
  }
}
