import type { Observable } from 'rxjs';
import type { DashboardSite } from '@profiles/application/contracts/dashboard-site';

/**
 * DashboardSiteDirectoryPort gives Profiles the read-only identity (id and name) of the sites the
 * dashboard can open on. Assets Management owns the sites and implements this port with an application
 * facade; it exposes no site registration, editing or ownership behavior. The backend scopes the directory
 * to the signed-in owner.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class DashboardSiteDirectoryPort {
  /**
   * Lists every site of the signed-in owner.
   * @returns An Observable of the sites.
   */
  abstract listSites(): Observable<DashboardSite[]>;
}
