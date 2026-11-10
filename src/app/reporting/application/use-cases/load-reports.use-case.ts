import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ReportPage, ReportQuery } from '@reporting/application/contracts/report-page';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/**
 * Loads one page of the owner's reports, most recently requested first, searched by name and filtered by
 * type, status and request time on the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadReportsUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @param query - The search, filters and paging.
   * @returns An Observable of the page.
   */
  execute(query: ReportQuery): Observable<ReportPage> {
    return this.reports.listReports({ ...query, search: query.search.trim() });
  }
}
