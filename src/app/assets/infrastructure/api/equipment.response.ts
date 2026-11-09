/**
 * EquipmentResource is returned by the equipment endpoints of `EquipmentController`, and as the items of
 * `GET /assets/equipments` (a plain JSON array when no paging is sent).
 */
export interface EquipmentResource {
  id: number;
  site_id: number;
  uid: string;
  name: string;
  equipment_type: string;
  status: string;
  online: boolean;
  min_celsius: number;
  max_celsius: number;
  reminder_interval_days: number;
  last_reading_at?: string | null;
  last_known_temperature?: number | null;
  config_version: number;
}

/**
 * PagedEquipmentResource is returned by `GET /assets/equipments` when both `page` and `size` are sent.
 */
export interface PagedEquipmentResource {
  content: EquipmentResource[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}
