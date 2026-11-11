import { Device } from '@device/domain/model/device.entity';
import {
  type DeviceConnectivity,
  isDeviceConnectivityState,
} from '@device/domain/value-objects/device-connectivity';
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
  DeviceConnectivityResource,
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
      connectivity: toConnectivity(resource.connectivity),
    });
  }

  /**
   * Converts the DeviceCredentialResource of a key rotation to the issued credential.
   * @param resource - The resource to convert.
   * @returns The device and its plaintext API key.
   */
  toIssuedCredentialFromResource(resource: DeviceCredentialResource): IssuedDeviceCredential {
    const apiKey = resource.api_key;
    if (typeof apiKey !== 'string' || apiKey === '') {
      throw new Error('The device credential has no API key.');
    }
    return { device: this.toDeviceFromResource(resource.device), apiKey };
  }

  /**
   * Converts the DeviceCredentialResource of a pairing to the issued credential. A replayed pairing
   * answers without the key, which was issued by the first attempt and is never returned again.
   * @param resource - The resource to convert.
   * @returns The device and its plaintext API key, or null for a replayed pairing.
   */
  toPairingCredentialFromResource(resource: DeviceCredentialResource): IssuedDeviceCredential {
    const apiKey = resource.api_key ?? null;
    if (apiKey === '') {
      throw new Error('The device credential has an empty API key.');
    }
    return { device: this.toDeviceFromResource(resource.device), apiKey };
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

function toConnectivity(resource: DeviceConnectivityResource): DeviceConnectivity {
  if (!isDeviceConnectivityState(resource.state)) {
    throw new Error('The device has an unknown connectivity state.');
  }
  const evaluatedAt = toOptionalInstant(resource.evaluated_at);
  if (evaluatedAt === null) {
    throw new Error('The device connectivity has no evaluation time.');
  }
  return {
    state: resource.state,
    silent_after_seconds: resource.silent_after_seconds ?? null,
    silent_since: toOptionalInstant(resource.silent_since),
    evaluated_at: evaluatedAt,
  };
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
