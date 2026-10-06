import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';

/**
 * Represents the response structure for user-related API calls, containing an array of user resources.
 */
export interface UserResponse extends BaseResponse {
  users: UserResource[];
}

/**
 * Represents a user resource with properties such as id, username, role, provider, and external_id.
 */
export interface UserResource extends BaseResource {
  id: number;
  username: string;
  role: string;
  provider: string;
}

