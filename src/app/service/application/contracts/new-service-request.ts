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
}

/** The longest description the backend accepts. */
export const SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH = 1000;
/** The longest cancellation reason the backend accepts. */
export const CANCEL_REASON_MAX_LENGTH = 500;
/** The longest review comment the backend accepts. */
export const REVIEW_COMMENT_MAX_LENGTH = 1000;
