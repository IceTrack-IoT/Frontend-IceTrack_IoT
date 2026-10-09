/**
 * AuthenticatedUserResponse is returned by Google verification and refresh-token requests.
 */
export interface AuthenticatedUserResponse {
  id: number;
  username: string;
  role: string;
  token: string;
  refresh_token: string;
  provider: string;
}
