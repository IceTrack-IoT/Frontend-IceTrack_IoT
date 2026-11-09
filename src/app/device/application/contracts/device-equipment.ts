/** The kind of refrigeration equipment, as Assets Management reports it. */
export type DeviceEquipmentType = 'DISPLAY_CASE' | 'COLD_ROOM' | 'REFRIGERATOR' | 'OTHER';

/** The lifecycle status of an equipment item, as Assets Management reports it. */
export type DeviceEquipmentStatus = 'ACTIVE' | 'MAINTENANCE' | 'REPAIR' | 'DEACTIVATED';

/**
 * An equipment item of the signed-in owner as Device Management needs it to pair devices and to name the
 * equipment a device reports for. Assets Management owns the equipment and its site; Device Management only
 * reads this identity.
 */
export interface DeviceEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
  /** The name of the site, or null when the site could not be read. */
  readonly siteName: string | null;
  readonly type: DeviceEquipmentType;
  readonly status: DeviceEquipmentStatus;
}
