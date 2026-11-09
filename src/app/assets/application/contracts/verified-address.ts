import type { CoverageArea } from '@assets/domain/value-objects/coverage-area';

/**
 * An address the backend verified inside the service area. Nothing is saved by verifying: the token
 * registers a site at this address, or moves a site to it, within 15 minutes.
 */
export interface VerifiedAddress {
  readonly formattedAddress: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly district: string | null;
  readonly area: CoverageArea;
  /** Opaque token to present when saving the site; valid for 15 minutes. */
  readonly validationToken: string;
}
