import type { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';

/**
 * EquipmentDirectoryEntry is the identity of one of the signed-in owner's equipment items: id, uid, name,
 * type, lifecycle status and site, with the site name. It carries no telemetry, threshold or connectivity,
 * so it is the narrow read-only contract Assets offers to bounded contexts that only refer to equipment.
 */
export interface EquipmentDirectoryEntry {
  readonly id: number;
  readonly uid: string;
  readonly name: string;
  readonly type: EquipmentType;
  readonly status: StatusEquipment;
  readonly siteId: number;
  readonly siteName: string;
}
