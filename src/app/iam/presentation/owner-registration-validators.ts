import { Validators } from '@angular/forms';

/**
 * Client-side format checks shared by the owner registration forms. They only give immediate feedback;
 * the backend remains authoritative.
 */

/** The owner RUC: exactly 11 digits. */
export const rucValidators = [Validators.required, Validators.pattern(/^\d{11}$/)];

/** Digits, spaces, hyphens and parentheses with an optional leading +, 7 to 20 characters. */
export const phoneValidators = [Validators.required, Validators.pattern(/^\+?[\d\s()-]{7,20}$/)];
