import { InjectionToken, type Signal } from '@angular/core';

/** The account signed in to the platform, as the shell and the settings view show it. */
export interface SignedInAccount {
  readonly id: number;
  readonly username: string;
}

/**
 * The signed-in account, or null when there is no session. The context that owns authentication provides
 * it, so the shell does not depend on that context.
 */
export const SIGNED_IN_ACCOUNT = new InjectionToken<Signal<SignedInAccount | null>>(
  'SIGNED_IN_ACCOUNT',
);
