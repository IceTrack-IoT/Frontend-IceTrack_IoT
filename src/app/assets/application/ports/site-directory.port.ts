import type { Observable } from 'rxjs';
import type { SiteSummary } from '@assets/application/contracts/site-summary';

/**
 * SiteDirectoryPort lists the signed-in owner's sites by id and name, for bounded contexts that need to
 * refer to a site without owning site data (for example, the site a dashboard opens on).
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class SiteDirectoryPort {
  /**
   * Lists every site of the signed-in owner.
   * @returns An Observable of the site summaries.
   */
  abstract listSites(): Observable<SiteSummary[]>;
}
