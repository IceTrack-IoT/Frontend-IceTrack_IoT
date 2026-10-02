/**
 * GoogleCredential is the application contract for a credential issued by Google Identity Services.
 *
 * The ID token is only forwarded to the backend for verification. It is never used or stored as the
 * platform access token.
 */
export interface GoogleCredential {
  /**
   * The Google ID token (JWT) issued to the user by Google.
   */
  readonly idToken: string;
}
