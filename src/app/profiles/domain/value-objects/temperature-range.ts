/**
 * The unit of both bounds of a temperature range: degrees Celsius or Fahrenheit.
 */
export type TemperatureUnit = 'C' | 'F';

/**
 * Checks whether a value is a supported temperature unit.
 * @param value - The value to check.
 * @returns True when the value is a TemperatureUnit.
 */
export function isTemperatureUnit(value: unknown): value is TemperatureUnit {
  return value === 'C' || value === 'F';
}

/**
 * Represents the reference temperature range a dashboard opens on. Both bounds are whole numbers in
 * `unit`, the minimum is never above the maximum, and the label is never blank.
 */
export interface TemperatureRange {
  min: number;
  max: number;
  unit: TemperatureUnit;
  label: string;
}
