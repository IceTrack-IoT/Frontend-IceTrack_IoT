import type { ClientChannelResource } from '@iam/infrastructure/api/client-channel.resource';

/**
 * SignInWithGoogleRequest is the request body of `POST /authentication/google/verify`.
 */
export interface SignInWithGoogleRequest {
  id_token: string;
  channel: ClientChannelResource;
}
