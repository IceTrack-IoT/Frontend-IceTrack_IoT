import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';

/**
 * The filters and paging the backend supports when listing the owner's equipment. Every filter only
 * narrows the owner's own equipment.
 */
export interface EquipmentQuery {
  /** Part of the name or uid to search for; blank searches nothing. */
  readonly search: string;
  readonly status: StatusEquipment | null;
  readonly type: EquipmentType | null;
  readonly siteId: number | null;
  /** The zero-based page index. */
  readonly page: number;
  /** The number of items per page, from 1 to 100. */
  readonly size: number;
}

/**
 * One page of the owner's equipment.
 */
export interface EquipmentPage {
  readonly items: readonly Equipment[];
  /** The zero-based page index. */
  readonly page: number;
  readonly size: number;
  /** The number of items matching the filters. */
  readonly totalElements: number;
  readonly totalPages: number;
}
