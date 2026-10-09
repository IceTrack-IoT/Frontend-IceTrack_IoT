/**
 * Speciality enum represents the different specialities of the electrician profile.
 */
export enum Speciality {
  REFRIGERATION = 'REFRIGERATION',
  ELECTRICAL = 'ELECTRICAL',
  GENERAL = 'GENERAL',
}

/**
 * Checks whether a value is one of the confirmed specialities.
 * @param value - The value to check.
 * @returns True when the value is a valid Speciality.
 */
export function isSpeciality(value: unknown): value is Speciality {
  return Object.values(Speciality).some((speciality) => speciality === value);
}
