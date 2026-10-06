/**
 * AuthenticatedUserResource is returned by Google verification and refresh-token requests.
 */
export interface AuthenticatedUserResource {
  id: number;
  username: string;
  role: string;
  token: string;
  refresh_token: string;
  provider: string;
}
