import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { VerifiedAddress } from '@assets/application/contracts/verified-address';
import { SitesPort } from '@assets/application/ports/sites.port';

/**
 * Verifies an address inside the service area before a site is registered at it or moved to it.
 * Nothing is saved; the returned token is valid for 15 minutes.
 */
@Injectable({
  providedIn: 'root',
})
export class ValidateSiteAddressUseCase {
  private readonly port = inject(SitesPort);

  /**
   * @param address - The free-form address.
   * @returns An Observable of the verified address.
   */
  execute(address: string): Observable<VerifiedAddress> {
    return this.port.validateAddress(address.trim());
  }
}
