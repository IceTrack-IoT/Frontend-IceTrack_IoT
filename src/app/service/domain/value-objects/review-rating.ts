/** The lowest score of a review criterion. */
export const MIN_REVIEW_SCORE = 1;
/** The highest score of a review criterion. */
export const MAX_REVIEW_SCORE = 5;

/**
 * Represents the scores of a service review, each an integer from 1 to 5.
 */
export interface ReviewRating {
  readonly communication: number;
  readonly efficacy: number;
  readonly performance: number;
}

/**
 * Checks whether a score is a valid review score: an integer from 1 to 5.
 * @param score - The score to check.
 * @returns True when the score is valid.
 */
export function isReviewScore(score: number): boolean {
  return Number.isInteger(score) && score >= MIN_REVIEW_SCORE && score <= MAX_REVIEW_SCORE;
}
