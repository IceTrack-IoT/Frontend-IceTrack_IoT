/**
 * SignUpRequest contains the fields shared by local owner and technician sign-up requests.
 */
export interface SignUpRequest {
  username: string;
  /** 8 to 64 characters with at least one uppercase letter, one lowercase letter and one digit. */
  password: string;
  email: string;
  full_name: string;
  phone: string;
  street: string;
  /** Documented as required by the backend but not enforced; this client always sends it. */
  number: string;
  city: string;
  postal_code: string;
  country: string;
}

/**
 * SignUpOwnerRequest is the request body of `POST /authentication/sign-up/owner`.
 */
export interface SignUpOwnerRequest extends SignUpRequest {
  /** The 11-digit taxpayer registration number (RUC). */
  ruc: number;
}
