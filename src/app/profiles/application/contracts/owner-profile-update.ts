/**
 * OwnerProfileUpdate replaces the name, contact details, address and RUC of the signed-in owner's profile.
 * The email belongs to the platform account and cannot be changed. The backend replaces the whole profile,
 * so every update carries the complete address, in parts.
 */
export interface OwnerProfileUpdate {
  readonly fullName: string;
  /** Phone number, optionally prefixed by the country code and a space. */
  readonly phone: string;
  readonly street: string;
  /** Street number or apartment, or null when the address has none. */
  readonly number: string | null;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  /** The 11-digit taxpayer registration number (RUC). */
  readonly ruc: number;
}
