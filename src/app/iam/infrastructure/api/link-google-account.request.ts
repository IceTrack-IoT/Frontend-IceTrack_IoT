import type { ClientChannelResource } from '@iam/infrastructure/api/client-channel.resource';

/**
 * LinkGoogleAccountRequest is the request body of `POST /authentication/google/link`.
 */
export interface LinkGoogleAccountRequest {
  id_token: string;
  /** The current local password of the account whose profile uses the Google email. */
  password: string;
  channel: ClientChannelResource;
}
