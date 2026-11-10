import type { ServicePriority } from '@service/domain/value-objects/service-priority';
import type { ServiceType } from '@service/domain/value-objects/service-type';

/**
 * The data an owner gives to create a service request. The backend creates it PENDING, without a
 * technician, and takes the site from the equipment.
 */
export interface NewServiceRequest {
  readonly equipmentId: number;
  readonly type: ServiceType;
  readonly priority: ServicePriority;
  /** What the owner needs; not blank, up to 1000 characters. */
  readonly description: string;
  /** The alert a corrective request is opened for, raised on the same equipment; null when none. */
  readonly sourceAlertId: number | null;
}

/**
 * A corrective request drafted from a monitoring alert: the alert and the equipment it was raised on.
 */
export interface AlertDraft {
  readonly alertId: number;
  readonly equipmentId: number;
}

/**
 * Chooses the alert a new request is linked to. The backend accepts only an alert of the caller raised on
 * the same equipment, whatever its status, so the alert is linked only while the selected equipment is the
 * one it was raised on.
 * @param draft - The alert the request was drafted from, or null when it was not drafted from one.
 * @param equipmentId - The equipment selected for the request.
 * @returns The alert to link, or null.
 */
export function linkedAlertIdFor(
  draft: AlertDraft | null,
  equipmentId: number | null,
): number | null {
  return draft !== null && equipmentId === draft.equipmentId ? draft.alertId : null;
}

/** The longest description the backend accepts. */
export const SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH = 1000;
/** The longest cancellation reason the backend accepts. */
export const CANCEL_REASON_MAX_LENGTH = 500;
/** The longest review comment the backend accepts. */
export const REVIEW_COMMENT_MAX_LENGTH = 1000;
