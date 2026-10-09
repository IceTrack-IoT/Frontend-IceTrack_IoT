/**
 * CurrentUserResponse is returned by `GET /authentication/me`.
 */
export interface CurrentUserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  provider: string;
}
