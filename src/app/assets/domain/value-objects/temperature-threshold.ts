/**
 * Represents the safe operating window of an equipment item, in degrees Celsius. Readings outside the window
 * are temperature excursions.
 */
export interface TemperatureThreshold {
  readonly min_celsius: number;
  readonly max_celsius: number;
}

/** The lowest bound, in degrees Celsius, a threshold may have. */
export const THRESHOLD_LOWEST_CELSIUS = 0;
/** The highest bound, in degrees Celsius, a threshold may have. */
export const THRESHOLD_HIGHEST_CELSIUS = 30;
