import type { RedirectFunction } from '@angular/router';
import { afterSessionResolved } from '@iam/presentation/guards/session-access';
import { ROLE_LANDING_URLS, roleLandingOf } from '@iam/presentation/role-landing';

/**
 * Redirects the root URL to the landing of the authenticated user's role, or to sign-in without a
 * session. Views navigate to the root after any authentication so this stays the only role decision.
 */
export const authenticatedLandingRedirect: RedirectFunction = () =>
  afterSessionResolved((user) =>
    user === null ? '/iam/login' : ROLE_LANDING_URLS[roleLandingOf(user.role)],
  );
