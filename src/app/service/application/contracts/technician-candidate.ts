/**
 * A technician as listed in the directory, by id and the data that identifies it. Profiles owns the
 * technician profile; Service Request Management consults it read-only.
 */
export interface TechnicianSummary {
  readonly technicianId: number;
  readonly fullName: string;
  /** Free text chosen by the technician. */
  readonly speciality: string;
  readonly certificationNumber: string;
}

/**
 * The read-only technician data an owner needs to decide an assignment: the summary plus the service
 * statistics of the technician's public profile.
 */
export interface TechnicianCandidate extends TechnicianSummary {
  /**
   * Whether the public profile could be read. A technician whose profile is unavailable cannot be
   * assigned, and its statistics are null.
   */
  readonly profileAvailable: boolean;
  /** The service requests the technician completed, or null when the profile is unavailable. */
  readonly completedServices: number | null;
  /**
   * The average review score from 1 to 5, or null when the technician has no reviews yet (never an
   * average of zero) or the profile is unavailable.
   */
  readonly averageRating: number | null;
}
