import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';

export interface UserResponse extends BaseResponse {
  users: UserResource[];
}

export interface UserResource extends BaseResource {
  id: number;
  username: string;
  role: string;
  provider: string;
  external_id: string | null;
}

