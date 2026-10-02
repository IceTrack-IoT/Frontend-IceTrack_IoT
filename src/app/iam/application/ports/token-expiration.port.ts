/**
 * TokenExpirationPort is the outbound port used to read the expiration declared by an access token.
 *
 * Reading an expiration is not a validation: signatures are never verified on the client.
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class TokenExpirationPort {
  /**
   * Reads the expiration declared by an access token.
   * @param accessToken - The platform access token.
   * @returns The expiration as epoch milliseconds, or null when it cannot be read.
   */
  abstract readExpiresAt(accessToken: string): number | null;
}
