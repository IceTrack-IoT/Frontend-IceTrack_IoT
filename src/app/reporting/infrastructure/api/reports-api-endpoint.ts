import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { CreateReportRequest } from '@reporting/infrastructure/api/report.requests';
import type {
  PagedReportResource,
  ReportDownloadLinkResource,
  ReportResource,
} from '@reporting/infrastructure/api/report.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/** The report list search, filters and paging, as query parameter values. */
export interface ReportListParams {
  search: string;
  types: readonly string[];
  statuses: readonly string[];
  requestedFrom: Date | null;
  requestedTo: Date | null;
  page: number;
  size: number;
}

/**
 * ReportsApiEndpoint sends the requests of the `ReportsController`.
 */
export class ReportsApiEndpoint {
  private readonly reportsUrl = `${baseUrl}${environment.iceTrackProviderReportsEndpointPath}`;
  private readonly reportByIdUrl = `${baseUrl}${environment.iceTrackProviderReportByIdEndpointPath}`;
  private readonly downloadLinkUrl = `${baseUrl}${environment.iceTrackProviderReportDownloadLinkEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /reports` (answers `202`) */
  requestReport(request: CreateReportRequest): Observable<ReportResource> {
    return this.http.post<ReportResource>(this.reportsUrl, request);
  }

  /**
   * `GET /reports?search&type&status&requested_from&requested_to&page&size`. Both `page` and `size` are
   * always sent, so the backend answers the paged envelope of summaries. Instants are sent in UTC (`Z`).
   */
  listReports(params: ReportListParams): Observable<PagedReportResource> {
    let query = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.search !== '') {
      query = query.set('search', params.search);
    }
    if (params.types.length > 0) {
      query = query.set('type', params.types.join(','));
    }
    if (params.statuses.length > 0) {
      query = query.set('status', params.statuses.join(','));
    }
    if (params.requestedFrom !== null) {
      query = query.set('requested_from', params.requestedFrom.toISOString());
    }
    if (params.requestedTo !== null) {
      query = query.set('requested_to', params.requestedTo.toISOString());
    }
    return this.http.get<PagedReportResource>(this.reportsUrl, { params: query });
  }

  /** `GET /reports/{reportId}/download-link` */
  getDownloadLink(reportId: number): Observable<ReportDownloadLinkResource> {
    return this.http.get<ReportDownloadLinkResource>(
      this.downloadLinkUrl.replace('{reportId}', encodeURIComponent(String(reportId))),
    );
  }

  /** `GET /reports/{reportId}` */
  getReport(reportId: number): Observable<ReportResource> {
    return this.http.get<ReportResource>(
      this.reportByIdUrl.replace('{reportId}', encodeURIComponent(String(reportId))),
    );
  }
}
