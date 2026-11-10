import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import type { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import type { AlertType } from '@monitoring/domain/value-objects/alert-type';

/**
 * The filters and paging the backend supports when listing the owner's alerts, whatever their status.
 * An empty list does not filter.
 */
export interface AlertQuery {
  readonly statuses: readonly AlertStatus[];
  readonly severities: readonly AlertSeverity[];
  readonly types: readonly AlertType[];
  readonly equipmentId: number | null;
  /** The zero-based page index. */
  readonly page: number;
  /** The number of alerts per page, from 1 to 100. */
  readonly size: number;
}

/** One page of the owner's alerts, most recently opened first. */
export interface AlertPage {
  readonly items: readonly Alert[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
