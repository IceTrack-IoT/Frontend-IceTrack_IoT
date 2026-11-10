import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * Represents a technician profile entity in the system. Owners consult it read-only.
 *
 * In the technician directory, `email`, `phone` and `address` are null unless the technician is actively
 * assigned to one of the owner's service requests.
 */
export class TechnicianProfile implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _full_name: string;
  private _email: string | null;
  private _phone: string | null;
  private _address: string | null;
  private _speciality: string;
  private _certification_number: string;

  /**
   * Creates a new instance of the TechnicianProfile class.
   *
   * @param technicianProfile - An object containing the properties of the technician profile.
   */
  public constructor(technicianProfile: {
    id: number;
    user_id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    speciality: string;
    certification_number: string;
  }) {
    this._id = technicianProfile.id;
    this._user_id = technicianProfile.user_id;
    this._full_name = technicianProfile.full_name;
    this._email = technicianProfile.email;
    this._phone = technicianProfile.phone;
    this._address = technicianProfile.address;
    this._speciality = technicianProfile.speciality;
    this._certification_number = technicianProfile.certification_number;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get user_id(): number {
    return this._user_id;
  }
  set user_id(user_id: number) {
    this._user_id = user_id;
  }
  get full_name(): string {
    return this._full_name;
  }
  set full_name(full_name: string) {
    this._full_name = full_name;
  }
  get email(): string | null {
    return this._email;
  }
  set email(email: string | null) {
    this._email = email;
  }
  get phone(): string | null {
    return this._phone;
  }
  set phone(phone: string | null) {
    this._phone = phone;
  }
  get address(): string | null {
    return this._address;
  }
  set address(address: string | null) {
    this._address = address;
  }
  /** The technician speciality, a free text chosen by the technician. */
  get speciality(): string {
    return this._speciality;
  }
  set speciality(speciality: string) {
    this._speciality = speciality;
  }
  get certification_number(): string {
    return this._certification_number;
  }
  set certification_number(certification_number: string) {
    this._certification_number = certification_number;
  }
}
