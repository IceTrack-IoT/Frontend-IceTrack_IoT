/**
 * EquipmentResource is returned by `GET /assets/equipments` (a plain JSON array when no paging is sent).
 * Only the properties read by this client are modeled.
 */
export interface EquipmentResource {
  id: number;
  site_id: number;
  name: string;
}
