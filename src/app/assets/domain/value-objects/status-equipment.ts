/**
 * StatusEquipment enum represents the lifecycle states of an equipment item.
 */
export enum StatusEquipment {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  DEACTIVATED = 'DEACTIVATED',
}

/**
 * The statuses each status may move to. Maintenance is only entered from ACTIVE, and a deactivated item
 * must be reactivated before moving anywhere else. The backend enforces the same matrix and stays
 * authoritative; this copy only decides which choices are offered.
 */
const STATUS_TRANSITIONS: Readonly<Record<StatusEquipment, readonly StatusEquipment[]>> = {
  [StatusEquipment.ACTIVE]: [
    StatusEquipment.MAINTENANCE,
    StatusEquipment.REPAIR,
    StatusEquipment.DEACTIVATED,
  ],
  [StatusEquipment.MAINTENANCE]: [
    StatusEquipment.ACTIVE,
    StatusEquipment.REPAIR,
    StatusEquipment.DEACTIVATED,
  ],
  [StatusEquipment.REPAIR]: [StatusEquipment.ACTIVE, StatusEquipment.DEACTIVATED],
  [StatusEquipment.DEACTIVATED]: [StatusEquipment.ACTIVE],
};

/**
 * Checks whether a value is one of the confirmed values of equipment status.
 * @param value - The value to check.
 * @returns True when the value is a StatusEquipment.
 */
export function isStatusEquipment(value: unknown): value is StatusEquipment {
  return Object.values(StatusEquipment).some((statusEquipment) => statusEquipment === value);
}

/**
 * Lists the statuses an equipment item may move to from its current status.
 * @param status - The current status.
 * @returns The allowed next statuses.
 */
export function nextStatusesOf(status: StatusEquipment): readonly StatusEquipment[] {
  return STATUS_TRANSITIONS[status];
}
