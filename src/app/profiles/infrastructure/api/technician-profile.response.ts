import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';

/**
 * TechnicianProfileResponse represents the response structure for a technician profile API endpoint.
 */
export interface TechnicianProfileResponse extends BaseResponse {
  technician_profiles: TechnicianProfileResource[];
}

/**
 * TechnicianProfileResource represents the structure of a technician profile resource returned by the API.
 */
export interface TechnicianProfileResource extends BaseResource {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  specialty: string;
  certification_number: string;
}
