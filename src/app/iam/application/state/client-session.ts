import type { User } from '@iam/domain/model/user.entity';
import type { AuthenticationResult } from '@iam/application/contracts/authentication-result';

/**
 * ClientSession is the application state of the authenticated user on this client.
 *
 * It is not a domain entity and is never sent to the backend as-is. The refresh token is part of it
 * because the backend contract requires it in the JSON body of refresh and logout requests.
 */
export interface ClientSession {
  /**
   * The authenticated user.
   */
  readonly user: User;

  /**
   * The platform access token issued by the backend.
   */
  readonly accessToken: string;

  /**
   * The current one-time-use platform refresh token.
   */
  readonly refreshToken: string;

  /**
   * The access token expiration as epoch milliseconds, for local UX decisions only.
   */
  readonly accessTokenExpiresAt: number;
}

/**
 * Creates a client session from an authentication result.
 * @param result - The authentication result issued by the backend.
 * @param accessTokenExpiresAt - The access token expiration as epoch milliseconds.
 * @returns The client session.
 */
export function createClientSession(
  result: AuthenticationResult,
  accessTokenExpiresAt: number,
): ClientSession {
  return {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpiresAt,
  };
}
