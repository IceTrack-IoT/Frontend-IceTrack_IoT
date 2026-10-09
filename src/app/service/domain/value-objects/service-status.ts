/**
 * ServiceStatus enum represents the lifecycle states of a service request.
 */
export enum ServiceStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
}

/**
 * Checks whether a value is one of the confirmed values of service status.
 * @param value - The value to check.
 * @returns True when the value is a ServiceStatus.
 */
export function isServiceStatus(value: unknown): value is ServiceStatus {
  return Object.values(ServiceStatus).some((serviceStatus) => serviceStatus === value);
}
