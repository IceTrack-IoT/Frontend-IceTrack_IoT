import type { ReviewRating } from '@service/domain/value-objects/review-rating';

/**
 * The scores and optional comment an owner gives when submitting or editing a review.
 */
export interface ReviewScores {
  readonly rating: ReviewRating;
  /** Up to 1000 characters; null when the owner leaves no comment. */
  readonly comment: string | null;
}

/**
 * Trims the comment of a review and sends a blank one as no comment.
 * @param scores - The scores and comment as collected.
 * @returns The scores with the normalized comment.
 */
export function normalizeReviewScores(scores: ReviewScores): ReviewScores {
  const comment = scores.comment?.trim() ?? '';
  return { rating: scores.rating, comment: comment === '' ? null : comment };
}
