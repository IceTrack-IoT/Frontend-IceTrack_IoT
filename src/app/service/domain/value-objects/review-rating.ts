/**
 * Represents the scores of a service review, each from 1 to 5.
 */
export interface ReviewRating {
  readonly communication: number;
  readonly efficacy: number;
  readonly performance: number;
}
