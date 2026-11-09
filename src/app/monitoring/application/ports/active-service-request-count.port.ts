import type { Observable } from 'rxjs';

/**
 * ActiveServiceRequestCountPort gives the monitoring overview the number of the owner's active service
 * requests (PENDING, ACCEPTED or IN_PROGRESS). Service Request Management owns the requests and implements
 * this port with an application facade; nothing else about the requests crosses the boundary.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ActiveServiceRequestCountPort {
  /**
   * Counts the owner's active service requests.
   * @returns An Observable of the count.
   */
  abstract countActiveServiceRequests(): Observable<number>;
}
