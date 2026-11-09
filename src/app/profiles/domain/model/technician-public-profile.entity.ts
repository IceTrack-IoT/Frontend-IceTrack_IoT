import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * The public profile of a technician that owners consult to choose an assignee: name, speciality,
 * certification and service statistics. It never carries contact data.
 *
 * The statistics are a read model updated shortly after each completed service or review, so they may lag
 * a few seconds behind.
 */
export class TechnicianPublicProfile implements BaseEntity {
  private readonly _id: number;
  private readonly _full_name: string;
  private readonly _speciality: string;
  private readonly _certification_number: string;
  private readonly _completed_services: number;
  private readonly _average_rating: number | null;
  private readonly _rating_available: boolean;

  /**
   * @param publicProfile - An object containing the properties of the public profile.
   */
  public constructor(publicProfile: {
    id: number;
    full_name: string;
    speciality: string;
    certification_number: string;
    completed_services: number;
    average_rating: number | null;
    rating_available: boolean;
  }) {
    this._id = publicProfile.id;
    this._full_name = publicProfile.full_name;
    this._speciality = publicProfile.speciality;
    this._certification_number = publicProfile.certification_number;
    this._completed_services = publicProfile.completed_services;
    this._average_rating = publicProfile.average_rating;
    this._rating_available = publicProfile.rating_available;
  }

  get id(): number {
    return this._id;
  }
  get full_name(): string {
    return this._full_name;
  }
  get speciality(): string {
    return this._speciality;
  }
  get certification_number(): string {
    return this._certification_number;
  }
  /** The service requests the technician completed. */
  get completed_services(): number {
    return this._completed_services;
  }
  /** The average review score between 1 and 5, or null until the technician's first review. */
  get average_rating(): number | null {
    return this._average_rating;
  }
  /** Whether the technician has been reviewed, so `average_rating` is available. */
  get rating_available(): boolean {
    return this._rating_available;
  }

  /**
   * The average review score when the technician has been reviewed, or null otherwise. A technician
   * without reviews has no average, never an average of zero.
   */
  get rating(): number | null {
    return this._rating_available ? this._average_rating : null;
  }
}
