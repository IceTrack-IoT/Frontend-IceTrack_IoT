import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { CreateReportRequest } from '@reporting/infrastructure/api/report.requests';
import type { ReportResource } from '@reporting/infrastructure/api/report.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/**
 * ReportsApiEndpoint sends the requests of the `ReportsController`.
 */
export class ReportsApiEndpoint {
  private readonly reportsUrl = `${baseUrl}${environment.iceTrackProviderReportsEndpointPath}`;
  private readonly reportByIdUrl = `${baseUrl}${environment.iceTrackProviderReportByIdEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /reports` (answers `202`) */
  requestReport(request: CreateReportRequest): Observable<ReportResource> {
    return this.http.post<ReportResource>(this.reportsUrl, request);
  }

  /** `GET /reports` */
  listReports(): Observable<ReportResource[]> {
    return this.http.get<ReportResource[]>(this.reportsUrl);
  }

  /** `GET /reports/{reportId}` */
  getReport(reportId: number): Observable<ReportResource> {
    return this.http.get<ReportResource>(
      this.reportByIdUrl.replace('{reportId}', encodeURIComponent(String(reportId))),
    );
  }
}
