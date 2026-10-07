/**
 * LocalCredential represents the credentials used for local authentication.
 */
export interface LocalCredential {
  /**
   * The username of the user attempting to authenticate.
   */
  readonly username: string;
  /**
   * The password of the user attempting to authenticate.
   */
  readonly password: string;
}
