import type { Observable } from 'rxjs';
import type { ReportScope } from '@reporting/application/contracts/report-scope';

/**
 * ReportScopePort gives Reporting the identity of the owner's sites and equipment, so a report can be
 * scoped to them and its scope named. Assets Management owns that data and implements this port with an
 * application facade; nothing else about the assets crosses the boundary. The backend scopes the read to
 * the signed-in owner.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ReportScopePort {
  /**
   * Lists the owner's sites and equipment.
   * @returns An Observable of the scope.
   */
  abstract loadScope(): Observable<ReportScope>;
}
