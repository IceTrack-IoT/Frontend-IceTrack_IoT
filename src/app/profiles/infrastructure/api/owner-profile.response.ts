/**
 * OwnerProfileResource is returned by the owner profile endpoints. `address` is the complete street
 * address as one text.
 */
export interface OwnerProfileResource {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  ruc: number;
}
