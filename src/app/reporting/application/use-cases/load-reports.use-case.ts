import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportsPort } from '@reporting/application/ports/reports.port';

/**
 * Loads every report the owner requested, most recent first.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadReportsUseCase {
  private readonly reports = inject(ReportsPort);

  /**
   * @returns An Observable of the reports.
   */
  execute(): Observable<Report[]> {
    return this.reports.listReports();
  }
}
