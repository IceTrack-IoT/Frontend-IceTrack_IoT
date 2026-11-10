import type { ClientChannelResource } from '@iam/infrastructure/api/client-channel.resource';

/**
 * SignInWithLocalRequest is the request body of `POST /authentication/sign-in/local`.
 */
export interface SignInWithLocalRequest {
  /** The username, or the email of the account's profile (matched case-insensitively). */
  username: string;
  password: string;
  channel: ClientChannelResource;
}
