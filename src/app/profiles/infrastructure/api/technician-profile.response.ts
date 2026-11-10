/**
 * TechnicianProfileResource is returned by the technician directory (`GET /profiles/technicians`, a plain
 * JSON array). `email`, `phone` and `address` are null unless the technician is actively assigned to one of
 * the caller's service requests.
 */
export interface TechnicianProfileResource {
  id: number;
  user_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  speciality: string;
  certification_number: string;
}
