import { InjectionToken } from '@angular/core';

/**
 * Ends the session of the signed-in user. The private layout runs it when the user asks to sign out; the
 * context that owns authentication provides it, so the shell does not depend on that context.
 */
export const SIGN_OUT_ACTION = new InjectionToken<() => void>('SIGN_OUT_ACTION');
