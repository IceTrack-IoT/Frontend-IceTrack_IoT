/**
 * EquipmentType enum represents the kinds of refrigeration equipment the backend accepts.
 */
export enum EquipmentType {
  DISPLAY_CASE = 'DISPLAY_CASE',
  COLD_ROOM = 'COLD_ROOM',
  REFRIGERATOR = 'REFRIGERATOR',
  OTHER = 'OTHER',
}

/**
 * Checks whether a value is one of the confirmed values of equipment type.
 * @param value - The value to check.
 * @returns True when the value is a EquipmentType.
 */
export function isEquipmentType(value: unknown): value is EquipmentType {
  return Object.values(EquipmentType).some((equipmentType) => equipmentType === value);
}
