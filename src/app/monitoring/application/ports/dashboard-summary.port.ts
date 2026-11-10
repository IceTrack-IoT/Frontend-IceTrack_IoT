import type { Observable } from 'rxjs';
import type { DashboardSummary } from '@monitoring/application/contracts/dashboard-summary';

/**
 * DashboardSummaryPort reads the totals of the owner's dashboard, computed by the backend.
 *
 * Definitive backend rejections are reported as MonitoringError; any other error is transient. Declared as
 * an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class DashboardSummaryPort {
  /**
   * @returns An Observable of the summary of every site of the owner.
   */
  abstract getSummary(): Observable<DashboardSummary>;
}
