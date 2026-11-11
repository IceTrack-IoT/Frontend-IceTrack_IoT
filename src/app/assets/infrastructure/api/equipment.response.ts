/**
 * EquipmentResource is returned by the equipment endpoints of `EquipmentController`, and as the items of
 * `GET /assets/equipments` (a plain JSON array when no paging is sent).
 * The deprecated `online` flag is not read: `connectivity` is the source of truth.
 */
export interface EquipmentResource {
  id: number;
  site_id: number;
  site_name: string;
  uid: string;
  name: string;
  equipment_type: string;
  status: string;
  min_celsius: number;
  max_celsius: number;
  reminder_interval_days: number;
  last_reading_at?: string | null;
  last_known_temperature?: number | null;
  config_version: number;
  connectivity: EquipmentConnectivityResource;
  /** Concurrency version, sent back in `If-Match` on the three `PUT` endpoints. */
  version: number;
}

/**
 * EquipmentConnectivityResource is the server's evaluation, on every read, of whether a unit is reporting.
 * `last_received_at` is null while the unit never reported, and `silent_since` is set only while it is silent.
 */
export interface EquipmentConnectivityResource {
  state: string;
  last_received_at?: string | null;
  silent_after_seconds: number;
  silent_since?: string | null;
  under_maintenance: boolean;
  evaluated_at: string;
}

/**
 * EquipmentDirectoryEntryResource is an item of `GET /assets/equipments/directory`: the identity of one of the
 * owner's units, without telemetry, threshold or connectivity.
 */
export interface EquipmentDirectoryEntryResource {
  id: number;
  uid: string;
  name: string;
  equipment_type: string;
  status: string;
  site_id: number;
  site_name: string;
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
