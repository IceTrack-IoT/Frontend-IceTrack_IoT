import type { Observable } from 'rxjs';
import type {
  TechnicianCandidate,
  TechnicianSummary,
} from '@service/application/contracts/technician-candidate';

/**
 * TechnicianProfilePort gives Service Request Management the read-only technician data it needs for
 * assignment decisions and service history. Profiles owns the technician profiles and implements this
 * port with an application facade; it exposes no technician editing or service-request behavior.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class TechnicianProfilePort {
  /**
   * Lists the technician directory, without statistics.
   * @returns An Observable of the technician summaries.
   */
  abstract listTechnicians(): Observable<TechnicianSummary[]>;

  /**
   * Lists the technicians an owner can choose from, each with the statistics of its public profile.
   * A technician whose public profile cannot be read is listed with `profileAvailable` false.
   * @returns An Observable of the technician candidates.
   */
  abstract listTechnicianCandidates(): Observable<TechnicianCandidate[]>;

  /**
   * Retrieves the public profile of one technician, with its statistics.
   * @param technicianId - The identifier of the technician profile.
   * @returns An Observable of the technician candidate.
   */
  abstract getTechnicianCandidate(technicianId: number): Observable<TechnicianCandidate>;
}
