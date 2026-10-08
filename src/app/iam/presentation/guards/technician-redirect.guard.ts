import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { afterSessionResolved } from '@iam/presentation/guards/session-access';
import { ROLE_LANDING_URLS, roleLandingOf } from '@iam/presentation/role-landing';

/**
 * Allows the technician redirect only to authenticated technicians. Without a session it redirects to
 * sign-in; any other role goes to the landing of its role.
 */
export const technicianRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  return afterSessionResolved((user) => {
    if (user === null) {
      return router.parseUrl('/iam/login');
    }
    const landing = roleLandingOf(user.role);
    return landing === 'technician-redirect' ? true : router.parseUrl(ROLE_LANDING_URLS[landing]);
  });
};
