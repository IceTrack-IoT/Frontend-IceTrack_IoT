import { BaseEntity } from '@shared/domain/model/base-entity';
import { ReviewRating } from '@service/domain/value-objects/review-rating';

/**
 * Represents the owner's review of the technician who completed a service request.
 *
 * The backend computes the average and the end of the edit window (`editable_until`, 48 hours after the
 * submission) and remains the authority on whether the review can still be edited.
 */
export class Review implements BaseEntity {
  private readonly _id: number;
  private readonly _service_request_id: number;
  private readonly _owner_id: number;
  private readonly _technician_id: number;
  private readonly _rating: ReviewRating;
  private readonly _average_rating: number;
  private readonly _comment: string | null;
  private readonly _created_at: Date;
  private readonly _editable_until: Date;

  /**
   * @param review - An object containing the properties of the review.
   */
  public constructor(review: {
    id: number;
    service_request_id: number;
    owner_id: number;
    technician_id: number;
    rating: ReviewRating;
    average_rating: number;
    comment: string | null;
    created_at: Date;
    editable_until: Date;
  }) {
    this._id = review.id;
    this._service_request_id = review.service_request_id;
    this._owner_id = review.owner_id;
    this._technician_id = review.technician_id;
    this._rating = review.rating;
    this._average_rating = review.average_rating;
    this._comment = review.comment;
    this._created_at = review.created_at;
    this._editable_until = review.editable_until;
  }

  get id(): number {
    return this._id;
  }
  get service_request_id(): number {
    return this._service_request_id;
  }
  get owner_id(): number {
    return this._owner_id;
  }
  /** The technician the review is about. */
  get technician_id(): number {
    return this._technician_id;
  }
  get rating(): ReviewRating {
    return this._rating;
  }
  /** The mean of the three scores computed by the backend, rounded to two decimals. */
  get average_rating(): number {
    return this._average_rating;
  }
  get comment(): string | null {
    return this._comment;
  }
  get created_at(): Date {
    return this._created_at;
  }
  /** Until when the backend accepts edits of the review. */
  get editable_until(): Date {
    return this._editable_until;
  }

  /**
   * Tells whether the edit window the backend reported is still open at a moment. It only decides what
   * the interface offers: the backend rejects late edits with `REVIEW_NOT_ALLOWED`.
   * @param moment - The moment to check, normally now.
   * @returns True while the moment is before `editable_until`.
   */
  isEditableAt(moment: Date): boolean {
    return moment.getTime() < this._editable_until.getTime();
  }
}
