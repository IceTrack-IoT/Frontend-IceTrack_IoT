import { type AbstractControl, type ValidatorFn, Validators } from '@angular/forms';
import {
  THRESHOLD_HIGHEST_CELSIUS,
  THRESHOLD_LOWEST_CELSIUS,
} from '@assets/domain/value-objects/temperature-threshold';

/** Validators of one threshold bound: required and within the accepted range of degrees Celsius. */
export const THRESHOLD_BOUND_VALIDATORS: ValidatorFn[] = [
  Validators.required,
  Validators.min(THRESHOLD_LOWEST_CELSIUS),
  Validators.max(THRESHOLD_HIGHEST_CELSIUS),
];

/**
 * Group validator: the `minCelsius` control must be strictly lower than the `maxCelsius` control. It only
 * guides the owner; the backend stays authoritative.
 */
export const minBelowMax: ValidatorFn = (group) => {
  const min: unknown = group.get('minCelsius')?.value;
  const max: unknown = group.get('maxCelsius')?.value;
  return typeof min === 'number' && typeof max === 'number' && min >= max
    ? { minNotBelowMax: true }
    : null;
};

/**
 * Resolves the translation key of the error of one threshold bound, once the owner has edited it.
 * @param control - The bound control.
 * @returns The translation key, or null when the bound is valid or untouched.
 */
export function thresholdBoundErrorKey(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }
  return control.hasError('required')
    ? 'shared.validation.required'
    : 'assets.thresholdForm.outOfRange';
}
