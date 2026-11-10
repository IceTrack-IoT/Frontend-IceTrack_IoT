import { Device } from '@device/domain/model/device.entity';
import { type DeviceStatus, isDeviceStatus } from '@device/domain/value-objects/device-status';
import type {
  DevicePairing,
  IssuedDeviceCredential,
} from '@device/application/contracts/device-pairing';
import type {
  ChangeDeviceStatusRequest,
  RegisterDeviceRequest,
} from '@device/infrastructure/api/device.requests';
import type {
  DeviceCredentialResource,
  DeviceResource,
} from '@device/infrastructure/api/device.response';

/**
 * DeviceAssembler converts the Device Management resources into domain entities and application contracts,
 * and application input into request bodies.
 *
 * A resource carrying a status outside the documented enumeration, an unreadable instant or a credential
 * without its key is rejected with an error instead of being shown wrongly.
 */
export class DeviceAssembler {
  /**
   * Converts a DeviceResource to a Device entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Device entity.
   */
  toDeviceFromResource(resource: DeviceResource): Device {
    if (!isDeviceStatus(resource.status)) {
      throw new Error('The device has an unknown status.');
    }
    return new Device({
      id: resource.id,
      device_uid: resource.device_uid,
      board_model: resource.board_model,
      firmware_version: resource.firmware_version ?? null,
      status: resource.status,
      paired_equipment_id: resource.paired_equipment_id ?? null,
      last_seen_at: toOptionalInstant(resource.last_seen_at),
    });
  }

  /**
   * Converts a DeviceCredentialResource to the issued credential.
   * @param resource - The resource to convert.
   * @returns The device and its plaintext API key.
   */
  toIssuedCredentialFromResource(resource: DeviceCredentialResource): IssuedDeviceCredential {
    if (typeof resource.api_key !== 'string' || resource.api_key === '') {
      throw new Error('The device credential has no API key.');
    }
    return {
      device: this.toDeviceFromResource(resource.device),
      apiKey: resource.api_key,
    };
  }

  /**
   * Converts a device pairing to the register request body.
   * @param pairing - The equipment and the board.
   * @returns The request body.
   */
  toRegisterDeviceRequest(pairing: DevicePairing): RegisterDeviceRequest {
    return {
      equipment_id: pairing.equipmentId,
      device_uid: pairing.deviceUid,
      board_model: pairing.boardModel,
      firmware_version: pairing.firmwareVersion,
    };
  }

  /**
   * Converts a device status to the change status request body.
   * @param status - The status to move the device to.
   * @returns The request body.
   */
  toChangeDeviceStatusRequest(status: DeviceStatus): ChangeDeviceStatusRequest {
    return { new_status: status };
  }
}

function toOptionalInstant(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('The device resource has an unreadable instant.');
  }
  return instant;
}
