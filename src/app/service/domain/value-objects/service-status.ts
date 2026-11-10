/**
 * ServiceStatus enum represents the lifecycle states of a service request.
 *
 * A technician rejection is not a status: the request stays PENDING without a technician, and the
 * rejection appears only in its status history.
 */
export enum ServiceStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

/**
 * Checks whether a value is one of the confirmed values of service status.
 * @param value - The value to check.
 * @returns True when the value is a ServiceStatus.
 */
export function isServiceStatus(value: unknown): value is ServiceStatus {
  return Object.values(ServiceStatus).some((serviceStatus) => serviceStatus === value);
}
