import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { DashboardSummary } from '@monitoring/application/contracts/dashboard-summary';
import { DashboardSummaryPort } from '@monitoring/application/ports/dashboard-summary.port';

/**
 * Loads the totals of the owner's dashboard, for example after a live alert change made them stale.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadDashboardSummaryUseCase {
  private readonly summary = inject(DashboardSummaryPort);

  /**
   * @returns An Observable of the summary.
   */
  execute(): Observable<DashboardSummary> {
    return this.summary.getSummary();
  }
}
