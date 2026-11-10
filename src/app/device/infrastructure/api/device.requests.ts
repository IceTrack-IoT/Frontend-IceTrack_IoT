/**
 * RegisterDeviceResource is the body of `POST /devices`: the equipment to pair with, the board UID and
 * model (not blank, up to 64 characters) and the optional firmware version (up to 64 characters).
 */
export interface RegisterDeviceRequest {
  equipment_id: number;
  device_uid: string;
  board_model: string;
  firmware_version: string | null;
}

/**
 * ChangeDeviceStatusResource is the body of `PUT /devices/{deviceId}/status`.
 */
export interface ChangeDeviceStatusRequest {
  new_status: 'UNPAIRED' | 'PAIRED' | 'REVOKED';
}
