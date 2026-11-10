import type { Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import type { NewSite, SiteDetails } from '@assets/application/contracts/site-registration';
import type { VerifiedAddress } from '@assets/application/contracts/verified-address';

/**
 * SitesPort is the outbound port used by Assets Management use cases to run the owner's site operations
 * of the backend: verify an address, register, list, update and move sites.
 *
 * Definitive backend rejections are reported as AssetsError; any other error is transient. Declared as an
 * abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class SitesPort {
  /**
   * Verifies an address inside the service area. Nothing is saved.
   * Fails with `VALIDATION_ERROR`, `ADDRESS_NOT_VERIFIED` (with candidates), `ADDRESS_OUT_OF_COVERAGE`,
   * `TOO_MANY_REQUESTS` or `GEOCODING_UNAVAILABLE`.
   * @param address - The free-form address, up to 255 characters.
   * @returns An Observable of the verified address and its validation token.
   */
  abstract validateAddress(address: string): Observable<VerifiedAddress>;

  /**
   * Registers a site of the owner at a verified address.
   * Fails with `VALIDATION_ERROR` or `ADDRESS_VALIDATION_REQUIRED` (missing, expired or foreign token).
   * @param site - The contact data and the validation token.
   * @returns An Observable of the registered site.
   */
  abstract registerSite(site: NewSite): Observable<Site>;

  /**
   * Lists every site of the owner.
   * @returns An Observable of the sites.
   */
  abstract listSites(): Observable<Site[]>;

  /**
   * Replaces the name, contact name and phone of one of the owner's sites.
   * Fails with `VALIDATION_ERROR` or `NOT_FOUND`.
   * @param siteId - The identifier of the site.
   * @param details - The new contact data.
   * @returns An Observable of the updated site.
   */
  abstract updateSite(siteId: number, details: SiteDetails): Observable<Site>;

  /**
   * Moves one of the owner's sites to a verified address, keeping its equipment.
   * Fails with `ADDRESS_VALIDATION_REQUIRED` or `NOT_FOUND`.
   * @param siteId - The identifier of the site.
   * @param validationToken - The token of the verified address.
   * @returns An Observable of the moved site.
   */
  abstract changeSiteAddress(siteId: number, validationToken: string): Observable<Site>;
}
