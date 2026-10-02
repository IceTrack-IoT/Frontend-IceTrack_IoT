import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marks a request that must not carry the platform bearer token.
 */
export const SKIP_AUTHENTICATION = new HttpContextToken<boolean>(() => false);

/**
 * Marks a request whose 401 response must not trigger a session refresh.
 */
export const SKIP_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * Marks a request that has already been retried once after a session refresh.
 */
export const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * Creates the context for public authentication endpoints: no bearer token and no automatic refresh.
 */
export function publicAuthenticationContext(): HttpContext {
  return new HttpContext().set(SKIP_AUTHENTICATION, true).set(SKIP_REFRESH, true);
}
