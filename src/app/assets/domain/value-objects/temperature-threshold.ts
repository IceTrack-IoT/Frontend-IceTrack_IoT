/**
 * Represents the safe operating window of an equipment item, in degrees Celsius. Readings outside the window
 * are temperature excursions.
 */
export interface TemperatureThreshold {
  readonly min_celsius: number;
  readonly max_celsius: number;
}
