/**
 * OwnerProfileResource is returned by the owner profile endpoints. `address` is the complete street
 * address composed from the parts that follow it; `version` is the concurrency version sent back in
 * `If-Match` on update.
 */
export interface OwnerProfileResource {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  street: string;
  /** Street number or apartment; null when the address has none. */
  number: string | null;
  city: string;
  postal_code: string;
  country: string;
  ruc: number;
  version: number;
}
