/**
 * ServiceType enum represents the kinds of service an owner can request.
 */
export enum ServiceType {
  PREVENTIVE_MAINTENANCE = 'PREVENTIVE_MAINTENANCE',
  REPAIR = 'REPAIR',
}

/**
 * Checks whether a value is one of the confirmed values of service type.
 * @param value - The value to check.
 * @returns True when the value is a ServiceType.
 */
export function isServiceType(value: unknown): value is ServiceType {
  return Object.values(ServiceType).some((serviceType) => serviceType === value);
}
