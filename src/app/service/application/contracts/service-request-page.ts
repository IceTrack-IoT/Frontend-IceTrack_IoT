import type { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import type { ServiceType } from '@service/domain/value-objects/service-type';

/**
 * The filters and paging the backend supports when listing the owner's service requests. Requests are
 * always ordered by creation date, newest first.
 */
export interface ServiceRequestQuery {
  /** The statuses to keep; empty keeps every status. */
  readonly statuses: readonly ServiceStatus[];
  /** The types to keep; empty keeps every type. */
  readonly types: readonly ServiceType[];
  /** The priorities to keep; empty keeps every priority. */
  readonly priorities: readonly ServicePriority[];
  /** The equipment item to keep, or null for every item. */
  readonly equipmentId: number | null;
  /** The zero-based page index. */
  readonly page: number;
  /** The number of requests per page, from 1 to 100. */
  readonly size: number;
}

/**
 * A service request as the list shows it: its state, the display names of its equipment, site and
 * technician, and whether it was completed and reviewed. The status history, the intervention and the
 * maintenance windows are read with the request itself.
 */
export interface ServiceRequestSummary {
  readonly id: number;
  readonly equipmentId: number;
  readonly siteId: number;
  /** The assigned technician profile, or null while none is assigned. */
  readonly technicianId: number | null;
  readonly type: ServiceType;
  readonly priority: ServicePriority;
  readonly status: ServiceStatus;
  readonly createdAt: Date;
  /** The display names at the time of the read, null when no longer known. */
  readonly equipmentName: string | null;
  readonly siteName: string | null;
  /** The full name of the assigned technician, or null while none is assigned. */
  readonly technicianName: string | null;
  readonly hasIntervention: boolean;
  readonly hasReview: boolean;
  /** The alert a corrective request was opened for, or null when none. */
  readonly sourceAlertId: number | null;
}

/**
 * Whether the owner may assign a technician to a listed request: only while it is PENDING or ACCEPTED and
 * has none.
 * @param summary - The listed request.
 * @returns True when a technician can be assigned.
 */
export function awaitsAssignment(summary: ServiceRequestSummary): boolean {
  return (
    (summary.status === ServiceStatus.PENDING || summary.status === ServiceStatus.ACCEPTED) &&
    summary.technicianId === null
  );
}

/**
 * One page of the owner's service requests.
 */
export interface ServiceRequestPage {
  readonly items: readonly ServiceRequestSummary[];
  /** The zero-based page index. */
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
