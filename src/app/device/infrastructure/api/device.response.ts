/**
 * DeviceResource is returned by `GET /devices` (as a JSON array without paging), `POST /devices/{deviceId}/unpair` and
 * `PUT /devices/{deviceId}/status`, and is embedded in DeviceCredentialResource. Nullable properties are
 * written as `null`; they are typed optional as well so a missing one is read as null.
 */
export interface DeviceResource {
  id: number;
  device_uid: string;
  board_model: string;
  firmware_version?: string | null;
  status: string;
  paired_equipment_id?: number | null;
  paired_equipment_name?: string | null;
  paired_site_id?: number | null;
  last_seen_at?: string | null;
  connectivity: DeviceConnectivityResource;
}

/**
 * DeviceConnectivityResource is the server's evaluation, on every read, of whether a board is reporting.
 * `silent_after_seconds` is null for an unpaired board and `silent_since` is set only while it is silent.
 */
export interface DeviceConnectivityResource {
  state: string;
  silent_after_seconds?: number | null;
  silent_since?: string | null;
  evaluated_at: string;
}

/**
 * DeviceCredentialResource is returned by `POST /devices` and `POST /devices/{deviceId}/rotate-api-key`:
 * the device and its plaintext API key (`it_dev_` followed by 64 hexadecimal characters), returned only
 * this once. A replayed `POST /devices` (same `Idempotency-Key`) answers without `api_key`, which the
 * backend never stores.
 */
export interface DeviceCredentialResource {
  device: DeviceResource;
  api_key?: string | null;
}
