import type { ProfilesFailure } from '@profiles/application/contracts/profiles-error';

/**
 * Translation keys of the feedback shown when a Profiles operation fails. Backend messages are never shown.
 */

/**
 * Resolves the translation key shown when saving the owner profile fails.
 * @param failure - The failure of the save, or null when it did not fail.
 * @returns The translation key, or null.
 */
export function ownerProfileSaveErrorKey(failure: ProfilesFailure | null): string | null {
  switch (failure) {
    case null:
      return null;
    case 'VALIDATION_ERROR':
      return 'profiles.ownerProfile.invalid';
    case 'ACCESS_DENIED':
      return 'profiles.ownerProfile.notAllowed';
    default:
      return 'profiles.ownerProfile.saveFailed';
  }
}

/**
 * Resolves the translation key shown when creating or saving the dashboard configuration fails.
 * @param failure - The failure of the save, or null when it did not fail.
 * @returns The translation key, or null.
 */
export function dashboardSaveErrorKey(failure: ProfilesFailure | null): string | null {
  switch (failure) {
    case null:
      return null;
    case 'VALIDATION_ERROR':
      return 'profiles.dashboard.customize.invalid';
    default:
      return 'profiles.dashboard.customize.saveFailed';
  }
}
