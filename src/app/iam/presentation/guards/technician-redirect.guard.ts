import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { IamStore } from '@iam/application/iam-store';
import { afterSessionResolved } from '@iam/presentation/guards/session-access';
import { ROLE_LANDING_URLS, roleLandingOf } from '@iam/presentation/role-landing';

/**
 * Allows the technician redirect only to technicians: an authenticated technician session, or a sign-in
 * the backend just rejected with `ROLE_CHANNEL_MISMATCH` (valid credentials of an account that must use
 * the mobile application; the web channel never issues a session for it). Anyone else without a session
 * goes to sign-in, and any other role goes to the landing of its role.
 */
export const technicianRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const iamStore = inject(IamStore);
  return afterSessionResolved((user) => {
    if (user === null) {
      return iamStore.mobileApplicationRequired() ? true : router.parseUrl('/iam/login');
    }
    const landing = roleLandingOf(user.role);
    return landing === 'technician-redirect' ? true : router.parseUrl(ROLE_LANDING_URLS[landing]);
  });
};
