/**
 * CurrentUserResponse is returned by `GET /authentication/me`. `email` is resolved from the profile.
 */
export interface CurrentUserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  provider: string;
}
