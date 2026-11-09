/**
 * Speciality enum lists example technician specialities.
 *
 * NOT part of the backend contract: a technician speciality is free text (see `TechnicianProfile`), and
 * Profiles no longer uses this enum. It is kept only because the Service Requests presentation mock still
 * imports it; remove it when that context integrates the technician directory.
 */
export enum Speciality {
  REFRIGERATION = 'REFRIGERATION',
  ELECTRICAL = 'ELECTRICAL',
  GENERAL = 'GENERAL',
}

/**
 * Checks whether a value is one of the example specialities.
 * @param value - The value to check.
 * @returns True when the value is a valid Speciality.
 */
export function isSpeciality(value: unknown): value is Speciality {
  return Object.values(Speciality).some((speciality) => speciality === value);
}
