import type { ClientChannelResource } from '@iam/infrastructure/api/client-channel.resource';

/**
 * RefreshTokenRequest is the request body of refresh-token and logout requests.
 */
export interface RefreshTokenRequest {
  refresh_token: string;
  /**
   * The channel the refresh comes from; when present it must be the channel the session was opened
   * from. Ignored by logout.
   */
  channel?: ClientChannelResource;
}
