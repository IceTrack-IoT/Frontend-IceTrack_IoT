/**
 * InterventionStatus enum represents the states of a field intervention.
 */
export enum InterventionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

/**
 * Checks whether a value is one of the confirmed values of intervention status.
 * @param value - The value to check.
 * @returns True when the value is a InterventionStatus.
 */
export function isInterventionStatus(value: unknown): value is InterventionStatus {
  return Object.values(InterventionStatus).some(
    (interventionStatus) => interventionStatus === value,
  );
}
