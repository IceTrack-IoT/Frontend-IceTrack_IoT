/**
 * EquipmentSummary identifies one of the signed-in owner's equipment items by id and name, together with
 * the site it is installed at. It is the narrow read-only contract Assets offers to other bounded contexts
 * that only need to refer to an equipment item.
 */
export interface EquipmentSummary {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
}
