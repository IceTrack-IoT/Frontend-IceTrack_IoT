import { BaseEntity } from '@shared/domain/model/base-entity';
import { ReviewRating } from '@service/domain/value-objects/review-rating';

/**
 * Represents the owner's review of the technician who completed a service request.
 */
export class Review implements BaseEntity {
  private _id: number;
  private _service_request_id: number;
  private _technician_profile_id: number;
  private _rating: ReviewRating;
  private _comment: string;

  /**
   * Creates a new instance of the Review class.
   *
   * @param review - An object containing the properties of the review.
   */
  public constructor(review: {
    id: number;
    service_request_id: number;
    technician_profile_id: number;
    rating: ReviewRating;
    comment: string;
  }) {
    this._id = review.id;
    this._service_request_id = review.service_request_id;
    this._technician_profile_id = review.technician_profile_id;
    this._rating = review.rating;
    this._comment = review.comment;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get service_request_id(): number {
    return this._service_request_id;
  }
  set service_request_id(service_request_id: number) {
    this._service_request_id = service_request_id;
  }
  get technician_profile_id(): number {
    return this._technician_profile_id;
  }
  set technician_profile_id(technician_profile_id: number) {
    this._technician_profile_id = technician_profile_id;
  }
  get rating(): ReviewRating {
    return this._rating;
  }
  set rating(rating: ReviewRating) {
    this._rating = rating;
  }
  get comment(): string {
    return this._comment;
  }
  set comment(comment: string) {
    this._comment = comment;
  }

  /**
   * Calculates the average of the scores of the review.
   * @returns The average score, from 1 to 5.
   */
  calculateAverage(): number {
    const { communication, efficacy, performance } = this._rating;
    return (communication + efficacy + performance) / 3;
  }
}
