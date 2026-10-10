import { computed, inject, type Signal } from '@angular/core';
import { IamStore } from '@iam/application/iam-store';
import type { SignedInAccount } from '@shared/presentation/components/private-layout/signed-in-account';

/**
 * Creates the signed-in account shown by the owner shell from the user of the current session. Must be
 * called in an injection context, such as a provider factory.
 * @returns A signal of the signed-in account, or of null when there is no session.
 */
export function createSignedInAccount(): Signal<SignedInAccount | null> {
  const iamStore = inject(IamStore);
  return computed(() => {
    const user = iamStore.currentUser();
    if (user === null) {
      return null;
    }
    return { id: user.id, username: user.username };
  });
}
