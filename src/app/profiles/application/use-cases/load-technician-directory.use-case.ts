import { inject, Injectable } from '@angular/core';
import { EMPTY, expand, type Observable, reduce } from 'rxjs';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import { ProfilesPort } from '@profiles/application/ports/profiles.port';

/** The largest page the public technician directory answers. */
const PAGE_SIZE = 100;

/**
 * Loads the public profile of every technician, with its statistics, by reading the public technician
 * directory page by page, ordered by name. It never carries contact data.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadTechnicianDirectoryUseCase {
  private readonly port = inject(ProfilesPort);

  /**
   * @returns An Observable of the public profiles, ordered by name.
   */
  execute(): Observable<TechnicianPublicProfile[]> {
    const pageOf = (page: number) => this.port.listTechnicianPublicProfiles(page, PAGE_SIZE);
    return pageOf(0).pipe(
      expand((page) => (page.page + 1 < page.totalPages ? pageOf(page.page + 1) : EMPTY)),
      reduce((profiles: TechnicianPublicProfile[], page) => profiles.concat(page.items), []),
    );
  }
}
