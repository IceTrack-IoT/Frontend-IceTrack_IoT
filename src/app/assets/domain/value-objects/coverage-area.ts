/**
 * CoverageArea enum represents the service areas where a site address can be verified.
 */
export enum CoverageArea {
  LIMA_METROPOLITANA = 'LIMA_METROPOLITANA',
  CALLAO = 'CALLAO',
}

/**
 * Checks whether a value is one of the confirmed values of coverage area.
 * @param value - The value to check.
 * @returns True when the value is a CoverageArea.
 */
export function isCoverageArea(value: unknown): value is CoverageArea {
  return Object.values(CoverageArea).some((coverageArea) => coverageArea === value);
}
