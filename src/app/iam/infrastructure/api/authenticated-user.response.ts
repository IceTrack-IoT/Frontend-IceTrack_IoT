/**
 * AuthenticatedUserResponse is returned by every sign-in (local, Google verification, Google account
 * link, Google registration completion) and by refresh-token requests.
 *
 * `id` is the user account id, not the owner or technician profile id.
 */
export interface AuthenticatedUserResponse {
  id: number;
  username: string;
  role: string;
  provider: string;
  /** The short-lived platform access token (JWT). */
  token: string;
  /** The single-use refresh token. */
  refresh_token: string;
}
