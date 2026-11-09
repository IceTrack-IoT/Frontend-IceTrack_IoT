import type { Device } from '@device/domain/model/device.entity';
import type { DeviceEquipment } from '@device/application/contracts/device-equipment';

/**
 * The signed-in owner's equipment together with the devices linked (PAIRED or REVOKED) to it. Unpaired
 * boards are linked to no equipment, so the backend does not list them.
 */
export interface DeviceInventory {
  readonly equipment: readonly DeviceEquipment[];
  readonly devices: readonly Device[];
}
