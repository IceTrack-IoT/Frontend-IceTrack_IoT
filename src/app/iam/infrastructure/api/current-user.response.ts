/**
 * CurrentUserResource is returned by `GET /authentication/me`.
 */
export interface CurrentUserResource {
  id: number;
  username: string;
  email: string;
  role: string;
  provider: string;
}
