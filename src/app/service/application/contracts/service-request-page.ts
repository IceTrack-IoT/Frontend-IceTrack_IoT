import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import type { ServiceStatus } from '@service/domain/value-objects/service-status';

/**
 * The filters and paging the backend supports when listing the owner's service requests. Requests are
 * always ordered by creation date, newest first.
 */
export interface ServiceRequestQuery {
  /** The statuses to keep; empty keeps every status. */
  readonly statuses: readonly ServiceStatus[];
  /** The zero-based page index. */
  readonly page: number;
  /** The number of requests per page, from 1 to 100. */
  readonly size: number;
}

/**
 * One page of the owner's service requests.
 */
export interface ServiceRequestPage {
  readonly items: readonly ServiceRequest[];
  /** The zero-based page index. */
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
