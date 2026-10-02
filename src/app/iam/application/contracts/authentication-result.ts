import type { User } from '@iam/domain/model/user.entity';

/**
 * AuthenticationResult is the platform token pair and authenticated user issued by the backend.
 */
export interface AuthenticationResult {
  readonly user: User;
  readonly accessToken: string;
  readonly refreshToken: string;
}
