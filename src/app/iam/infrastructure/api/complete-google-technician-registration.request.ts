/**
 * CompleteGoogleTechnicianRegistrationRequest is the request body for completing the registration of a technician using Google authentication.
 */
export interface CompleteGoogleTechnicianRegistrationRequest {
  id_token: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  postal_code: string;
  country: string;
  speciality: string;
  certification_number: string;
}
