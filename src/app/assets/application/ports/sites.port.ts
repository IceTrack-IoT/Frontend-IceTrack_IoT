import type { Observable } from 'rxjs';
import type { Site } from '@assets/domain/model/site.entity';
import type { NewSite, SiteDetails } from '@assets/application/contracts/site-registration';
import type { VerifiedAddress } from '@assets/application/contracts/verified-address';

/**
 * SitesPort is the outbound port used by Assets Management use cases to run the owner's site operations
 * of the backend: verify an address, register, list, update and move sites, and locate them again.
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
   * Replaces the name, contact name and phone of one of the owner's sites, only when the site is still at
   * the given version. Fails with `VALIDATION_ERROR`, `NOT_FOUND` or `CONCURRENT_MODIFICATION_CONFLICT`
   * (the site changed since that version; nothing is changed).
   * @param siteId - The identifier of the site.
   * @param version - The version of the site the change was made from.
   * @param details - The new contact data.
   * @returns An Observable of the updated site.
   */
  abstract updateSite(siteId: number, version: number, details: SiteDetails): Observable<Site>;

  /**
   * Moves one of the owner's sites to a verified address, keeping its equipment, only when the site is
   * still at the given version. Fails with `ADDRESS_VALIDATION_REQUIRED`, `NOT_FOUND` or
   * `CONCURRENT_MODIFICATION_CONFLICT`.
   * @param siteId - The identifier of the site.
   * @param version - The version of the site the change was made from.
   * @param validationToken - The token of the verified address.
   * @returns An Observable of the moved site.
   */
  abstract changeSiteAddress(
    siteId: number,
    version: number,
    validationToken: string,
  ): Observable<Site>;

  /**
   * Looks the current address of a site that is not located up again. The site comes back located,
   * `NOT_FOUND` with its failure reason, or `PENDING` while the lookup continues in the background.
   * Fails with `NOT_FOUND`, `INVALID_STATUS_TRANSITION` (the site is already located),
   * `TOO_MANY_REQUESTS` (shared with address verification) or `GEOCODING_UNAVAILABLE` (the site is left
   * `FAILED`).
   * @param siteId - The identifier of the site.
   * @returns An Observable of the site after the lookup.
   */
  abstract retrySiteGeocoding(siteId: number): Observable<Site>;
}
