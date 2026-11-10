/**
 * CompleteGoogleOwnerRegistrationRequest is the request body of
 * `POST /authentication/google/complete-registration/owner`. The backend takes the full name and email
 * from the Google ID token, so they are never sent.
 */
export interface CompleteGoogleOwnerRegistrationRequest {
  id_token: string;
  /** The desired username, unique on the platform. */
  username: string;
  phone: string;
  street: string;
  /** Documented as required by the backend but not enforced; this client always sends it. */
  number: string;
  city: string;
  postal_code: string;
  country: string;
  /** The 11-digit taxpayer registration number (RUC). */
  ruc: number;
}
