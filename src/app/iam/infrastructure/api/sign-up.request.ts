/**
 * SignUpRequest contains the fields shared by local owner and technician sign-up requests.
 */
export interface SignUpRequest {
  username: string;
  password: string;
  email: string;
  full_name: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  postal_code: string;
  country: string;
}

/**
 * SignUpOwnerRequest is the request body of `POST /authentication/sign-up/owner`.
 */
export interface SignUpOwnerRequest extends SignUpRequest {
  ruc: number;
}

/**
 * SignUpTechnicianRequest is the request body of `POST /authentication/sign-up/technician`.
 */
export interface SignUpTechnicianRequest extends SignUpRequest {
  speciality: string;
  certification_number: string;
}
