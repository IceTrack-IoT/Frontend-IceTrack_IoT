import { type DestroyRef, InjectionToken } from '@angular/core';

/**
 * The lifetime of the owner shell the current view renders in. The shell is created when the owner enters
 * the private area and destroyed when they leave it (sign-out, an ended session), so state kept for this
 * lifetime survives navigation between views but never outlives the session that loaded it.
 *
 * Provided by the shell to every view routed inside it.
 */
export const SHELL_LIFETIME = new InjectionToken<DestroyRef>('SHELL_LIFETIME');
