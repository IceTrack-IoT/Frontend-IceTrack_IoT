import type { ServiceRequestsFailure } from '@service/application/contracts/service-requests-error';
import type { ServiceRequestAction } from '@service/application/service-requests-store';

/**
 * Translation keys of the feedback shown for Service Request Management operations. Backend messages are
 * never shown.
 */

/** The confirmation announced when an action on a request succeeds. */
export const ACTION_SUCCESS_KEYS: Readonly<Record<ServiceRequestAction, string>> = {
  assign: 'serviceRequests.detail.assigned',
  cancel: 'serviceRequests.detail.canceled',
  'submit-review': 'serviceRequests.detail.reviewed',
  'update-review': 'serviceRequests.detail.reviewUpdated',
};

/**
 * Resolves the translation key shown when an action on a request fails.
 * @param action - The failed action.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function actionErrorKey(
  action: ServiceRequestAction,
  failure: ServiceRequestsFailure,
): string {
  switch (failure) {
    case 'VALIDATION_ERROR':
      return 'serviceRequests.errors.invalid';
    case 'ACCESS_DENIED':
      return 'serviceRequests.errors.notAllowed';
    case 'NOT_FOUND':
      return 'serviceRequests.errors.notFound';
    case 'INVALID_STATUS_TRANSITION':
      return action === 'cancel'
        ? 'serviceRequests.errors.cancelNotAllowed'
        : action === 'assign'
          ? 'serviceRequests.errors.assignNotAllowed'
          : 'serviceRequests.errors.staleState';
    case 'TECHNICIAN_NOT_ELIGIBLE':
      return 'serviceRequests.errors.technicianNotEligible';
    case 'REVIEW_NOT_ALLOWED':
      return action === 'update-review'
        ? 'serviceRequests.errors.reviewEditExpired'
        : 'serviceRequests.errors.reviewNotAllowed';
    case 'DUPLICATE_RESOURCE_CONFLICT':
      return 'serviceRequests.errors.alreadyReviewed';
    case 'CONCURRENT_MODIFICATION_CONFLICT':
      return 'serviceRequests.errors.concurrentChange';
    case 'IDEMPOTENCY_KEY_CONFLICT':
      return 'serviceRequests.errors.submissionInProgress';
    case 'UNEXPECTED':
      return 'serviceRequests.errors.unexpected';
  }
}

/**
 * Resolves the translation key shown when creating a request fails.
 * @param failure - Why it failed, or null when it did not fail.
 * @param alertLinked - Whether the request was linked to the alert it was drafted from. The backend then
 * answers `404` for an unreachable alert as well as for unreachable equipment.
 * @returns The translation key, or null.
 */
export function createErrorKey(
  failure: ServiceRequestsFailure | null,
  alertLinked = false,
): string | null {
  switch (failure) {
    case null:
      return null;
    case 'VALIDATION_ERROR':
      return 'serviceRequests.errors.invalid';
    case 'ACCESS_DENIED':
      return 'serviceRequests.errors.notAllowed';
    case 'NOT_FOUND':
      return alertLinked
        ? 'serviceRequests.errors.equipmentOrAlertNotFound'
        : 'serviceRequests.errors.equipmentNotFound';
    case 'IDEMPOTENCY_KEY_CONFLICT':
      return 'serviceRequests.errors.submissionInProgress';
    default:
      return 'serviceRequests.errors.unexpected';
  }
}
