/**
 * CompleteGoogleOwnerRegistrationRequest is the request object for completing the Google owner registration.
 */
export interface CompleteGoogleOwnerRegistrationRequest {
  id_token: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  postal_code: string;
  country: string;
  ruc: number;
}
