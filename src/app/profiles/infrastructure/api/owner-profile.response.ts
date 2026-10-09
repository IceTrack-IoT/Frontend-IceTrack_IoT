import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';

/**
 * Represents the structure of the response returned by the API for owner profiles.
 */
export interface OwnerProfileResponse extends BaseResponse {
  owner_profiles: OwnerProfileResource[];
}

/**
 * Represents the structure of an owner profile resource returned by the API.
 */
export interface OwnerProfileResource extends BaseResource {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  ruc: number;
}
