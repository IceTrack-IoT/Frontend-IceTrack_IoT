/**
 * ServicePriority enum represents the priority levels of a service request.
 */
export enum ServicePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Checks whether a value is one of the confirmed values of service priority.
 * @param value - The value to check.
 * @returns True when the value is a ServicePriority.
 */
export function isServicePriority(value: unknown): value is ServicePriority {
  return Object.values(ServicePriority).some((servicePriority) => servicePriority === value);
}
