import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';

/**
 * One page of the public technician directory, ordered by name.
 */
export interface TechnicianPublicProfilePage {
  readonly items: readonly TechnicianPublicProfile[];
  /** The zero-based page index. */
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
