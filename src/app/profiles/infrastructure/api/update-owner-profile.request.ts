/**
 * UpdateOwnerProfileRequest is the request body of `PUT /profiles/owners/{ownerId}`. The email cannot be
 * changed here.
 */
export interface UpdateOwnerProfileRequest {
  full_name: string;
  phone: string;
  street: string;
  /** Optional: the backend accepts a missing street number. */
  number: string | null;
  city: string;
  postal_code: string;
  country: string;
  /** The 11-digit taxpayer registration number (RUC). */
  ruc: number;
}
