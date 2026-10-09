import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { IamStore } from '@iam/application/iam-store';

/**
 * Creates the sign-out action of the owner shell: it ends the session and returns to sign-in. Must be
 * called in an injection context, such as a provider factory.
 * @returns The sign-out action.
 */
export function createSignOutAction(): () => void {
  const iamStore = inject(IamStore);
  const router = inject(Router);
  return () => {
    iamStore.signOut();
    void router.navigateByUrl('/iam/login');
  };
}
