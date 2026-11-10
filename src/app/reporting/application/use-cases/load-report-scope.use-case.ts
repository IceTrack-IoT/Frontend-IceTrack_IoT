import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ReportScope } from '@reporting/application/contracts/report-scope';
import { ReportScopePort } from '@reporting/application/ports/report-scope.port';

/**
 * Loads the owner's sites and equipment (from Assets Management), to scope a report and to name the scope
 * of an existing one.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadReportScopeUseCase {
  private readonly scope = inject(ReportScopePort);

  /**
   * @returns An Observable of the sites and equipment.
   */
  execute(): Observable<ReportScope> {
    return this.scope.loadScope();
  }
}
