import type { ClientSession } from '@iam/application/state/client-session';

/**
 * The confirmed platform access token lifetime (30 minutes), used only as a fallback when the token's
 * own `exp` claim cannot be read. It is never treated as backend authorization.
 */
export const ACCESS_TOKEN_FALLBACK_LIFETIME_MS = 30 * 60 * 1000;

/**
 * Resolves the access token expiration, falling back to the confirmed lifetime from token receipt.
 * @param declaredExpiresAt - The expiration declared by the token, or null when unreadable.
 * @param receivedAt - The instant the token was received, as epoch milliseconds.
 * @returns The access token expiration as epoch milliseconds.
 */
export function resolveAccessTokenExpiresAt(
  declaredExpiresAt: number | null,
  receivedAt: number,
): number {
  return declaredExpiresAt ?? receivedAt + ACCESS_TOKEN_FALLBACK_LIFETIME_MS;
}

/**
 * Determines whether the session access token is expired at the given instant.
 * @param session - The client session to evaluate.
 * @param now - The current instant as epoch milliseconds.
 * @returns True when the access token expiration has been reached.
 */
export function isAccessTokenExpired(session: ClientSession, now: number): boolean {
  return session.accessTokenExpiresAt <= now;
}
