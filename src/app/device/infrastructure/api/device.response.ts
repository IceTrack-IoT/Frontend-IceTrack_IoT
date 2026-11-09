/**
 * DeviceResource is returned by `GET /devices` (as a JSON array), `POST /devices/{deviceId}/unpair` and
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
  last_seen_at?: string | null;
}

/**
 * DeviceCredentialResource is returned by `POST /devices` and `POST /devices/{deviceId}/rotate-api-key`:
 * the device and its plaintext API key (`it_dev_` followed by 64 hexadecimal characters), returned only
 * this once.
 */
export interface DeviceCredentialResource {
  device: DeviceResource;
  api_key: string;
}
