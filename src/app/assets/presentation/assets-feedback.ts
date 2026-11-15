import { GeocodingFailureReason } from '@assets/domain/value-objects/geocoding-failure-reason';
import { GeocodingStatus } from '@assets/domain/value-objects/geocoding-status';
import type { AssetsFailure } from '@assets/application/contracts/assets-error';
import type { EquipmentAction, SiteAction } from '@assets/application/assets-store';

/**
 * Translation keys of the feedback shown for Assets Management operations. Backend messages are never
 * shown.
 */

/** The confirmation announced when a site action succeeds. */
export const SITE_ACTION_SUCCESS_KEYS: Readonly<Record<SiteAction, string>> = {
  register: 'assets.siteList.registered',
  update: 'assets.siteList.updated',
  'change-address': 'assets.siteList.addressChanged',
};

/** The confirmation announced when an equipment action succeeds. */
export const EQUIPMENT_ACTION_SUCCESS_KEYS: Readonly<Record<EquipmentAction, string>> = {
  register: 'assets.equipmentList.registered',
  update: 'assets.equipmentDetail.updated',
  threshold: 'assets.equipmentDetail.thresholdSaved',
  status: 'assets.equipmentDetail.statusChanged',
};

/**
 * Resolves the translation key shown when verifying a site address fails.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function addressVerificationErrorKey(failure: AssetsFailure): string {
  switch (failure) {
    case 'ADDRESS_NOT_VERIFIED':
      return 'assets.errors.addressNotVerified';
    case 'ADDRESS_OUT_OF_COVERAGE':
      return 'assets.errors.addressOutOfCoverage';
    case 'TOO_MANY_REQUESTS':
      return 'assets.errors.tooManyVerifications';
    case 'GEOCODING_UNAVAILABLE':
      return 'assets.errors.verificationUnavailable';
    default:
      return commonErrorKey(failure, 'assets.errors.unexpected');
  }
}

/**
 * Resolves the translation key shown when a site action fails.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function siteActionErrorKey(failure: AssetsFailure): string {
  switch (failure) {
    case 'ADDRESS_VALIDATION_REQUIRED':
      return 'assets.errors.addressVerificationExpired';
    case 'PIN_OUT_OF_RANGE':
      return 'assets.errors.invalid';
    case 'CONCURRENT_MODIFICATION_CONFLICT':
      return 'assets.errors.siteChangedMeanwhile';
    default:
      return commonErrorKey(failure, 'assets.errors.siteNotFound');
  }
}

/**
 * Resolves the translation key announced once a site location lookup finished.
 * @param outcome - The geocoding status the site came back with.
 * @returns The translation key.
 */
export function geocodingRetryOutcomeKey(outcome: GeocodingStatus | null): string {
  switch (outcome) {
    case GeocodingStatus.RESOLVED:
      return 'assets.siteList.geocoding.located';
    case GeocodingStatus.PENDING:
      return 'assets.siteList.geocoding.stillLocating';
    default:
      return 'assets.siteList.geocoding.stillNotLocated';
  }
}

/**
 * Resolves the translation key shown when a site location lookup fails.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function geocodingRetryErrorKey(failure: AssetsFailure): string {
  switch (failure) {
    case 'INVALID_STATUS_TRANSITION':
      return 'assets.siteList.geocoding.alreadyLocated';
    case 'TOO_MANY_REQUESTS':
      return 'assets.siteList.geocoding.tooManyRetries';
    case 'GEOCODING_UNAVAILABLE':
      return 'assets.siteList.geocoding.unavailable';
    default:
      return commonErrorKey(failure, 'assets.errors.siteNotFound');
  }
}

/**
 * Resolves the translation key of the hint shown on a site that is not located.
 * @param status - The geocoding status of the site.
 * @param reason - Why it could not be located, when known.
 * @returns The translation key, or null for a located site.
 */
export function geocodingHintKey(
  status: GeocodingStatus,
  reason: GeocodingFailureReason | null,
): string | null {
  if (status === GeocodingStatus.RESOLVED) {
    return null;
  }
  if (status === GeocodingStatus.PENDING) {
    return 'assets.siteList.geocoding.pending';
  }
  switch (reason) {
    case GeocodingFailureReason.ADDRESS_NOT_FOUND:
      return 'assets.siteList.geocoding.addressNotFound';
    case GeocodingFailureReason.OUT_OF_COVERAGE:
      return 'assets.siteList.geocoding.outOfCoverage';
    case GeocodingFailureReason.PROVIDER_UNAVAILABLE:
      return 'assets.siteList.geocoding.providerUnavailable';
    default:
      return 'assets.siteList.geocoding.unknown';
  }
}

/**
 * Resolves the translation key shown when an equipment action fails.
 * @param action - The failed action.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function equipmentActionErrorKey(action: EquipmentAction, failure: AssetsFailure): string {
  switch (failure) {
    case 'EQUIPMENT_CONFLICT':
    case 'DUPLICATE_RESOURCE_CONFLICT':
      return 'assets.errors.duplicateUid';
    case 'INVALID_STATUS_TRANSITION':
      return 'assets.errors.statusNotAllowed';
    case 'CONCURRENT_MODIFICATION_CONFLICT':
      return 'assets.errors.concurrentChange';
    case 'VALIDATION_ERROR':
      return action === 'threshold' ? 'assets.errors.invalidThreshold' : 'assets.errors.invalid';
    default:
      return commonErrorKey(
        failure,
        action === 'register' ? 'assets.errors.siteNotFound' : 'assets.errors.equipmentNotFound',
      );
  }
}

function commonErrorKey(failure: AssetsFailure, notFoundKey: string): string {
  switch (failure) {
    case 'VALIDATION_ERROR':
      return 'assets.errors.invalid';
    case 'ACCESS_DENIED':
      return 'assets.errors.notAllowed';
    case 'NOT_FOUND':
      return notFoundKey;
    case 'IDEMPOTENCY_KEY_CONFLICT':
      return 'assets.errors.submissionInProgress';
    default:
      return 'assets.errors.unexpected';
  }
}
