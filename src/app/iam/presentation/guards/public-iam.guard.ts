import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { afterSessionResolved } from '@iam/presentation/guards/session-access';
import { ROLE_LANDING_URLS, roleLandingOf } from '@iam/presentation/role-landing';

/**
 * Allows the public IAM views without a session. Authenticated users go to the landing of their role,
 * except that users who are not owners may stay on the unauthorized view.
 */
export const publicIamGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return afterSessionResolved((user) => {
    if (user === null) {
      return true;
    }
    const landing = roleLandingOf(user.role);
    if (landing !== 'owner-home' && state.url.startsWith(ROLE_LANDING_URLS.unauthorized)) {
      return true;
    }
    return router.parseUrl(ROLE_LANDING_URLS[landing]);
  });
};
