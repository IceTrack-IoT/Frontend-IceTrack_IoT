import { effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IamStore } from '@iam/application/iam-store';
import { ROLE_LANDING_URLS } from '@iam/presentation/role-landing';

/** The view where an unregistered Google account completes its owner registration. */
export const GOOGLE_REGISTRATION_URL = '/iam/complete-google-registration';

/** The view where a Google account is linked to the password account that uses its email. */
export const GOOGLE_ACCOUNT_LINK_URL = '/iam/link-google-account';

/**
 * Resolves where an authentication attempt continues, from the IAM store state:
 * - the root once a session exists, which routes the user by role;
 * - the technician redirect when the account must use the mobile application;
 * - the Google onboarding step the backend requested.
 * @param iamStore - The IAM store.
 * @returns The URL to continue to, or null while the attempt has not led anywhere else.
 */
export function authenticationContinuationUrl(iamStore: IamStore): string | null {
  if (iamStore.isAuthenticated()) {
    return '/';
  }
  if (iamStore.mobileApplicationRequired()) {
    return ROLE_LANDING_URLS['technician-redirect'];
  }
  if (iamStore.googleRegistrationRequired()) {
    return GOOGLE_REGISTRATION_URL;
  }
  if (iamStore.googleAccountLinkRequired()) {
    return GOOGLE_ACCOUNT_LINK_URL;
  }
  return null;
}

/**
 * Navigates to where the authentication attempt continues as soon as the IAM store reports it. Must be
 * called in an injection context, such as a view constructor.
 * @param currentUrl - The URL of the calling view, which is never navigated to again.
 */
export function followAuthenticationContinuation(currentUrl: string): void {
  const iamStore = inject(IamStore);
  const router = inject(Router);
  effect(() => {
    const url = authenticationContinuationUrl(iamStore);
    if (url !== null && url !== currentUrl) {
      void router.navigateByUrl(url);
    }
  });
}
