/**
 * UserResource is returned by the local sign-up endpoints. It carries no tokens.
 */
export interface UserResource {
  id: number;
  username: string;
  role: string;
  provider: string;
}
