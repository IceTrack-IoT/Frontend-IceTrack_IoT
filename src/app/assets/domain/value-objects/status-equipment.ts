/**
 * StatusEquipment enum represents the operational states of an equipment item.
 */
export enum StatusEquipment {
  ACTIVE = 'ACTIVE',
  DESACTIVATE = 'DESACTIVATE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
}

/**
 * Checks whether a value is one of the confirmed values of equipment status.
 * @param value - The value to check.
 * @returns True when the value is a StatusEquipment.
 */
export function isStatusEquipment(value: unknown): value is StatusEquipment {
  return Object.values(StatusEquipment).some((statusEquipment) => statusEquipment === value);
}
