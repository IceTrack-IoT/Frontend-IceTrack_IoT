import { BaseEntity } from '@shared/domain/model/base-entity';
import { Speciality } from '@profiles/domain/value-objects/speciality';

/**
 * Represents a technician profile entity in the system.
 */
export class TechnicianProfile implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _full_name: string;
  private _email: string;
  private _phone: string;
  private _address: string;
  private _specialty: Speciality;
  private _certification_number: string;

  /**
   * Creates a new instance of the TechnicianProfileEntity class.
   *
   * @param technicianProfile - An object containing the properties of the technician profile.
   */
  public constructor(technicianProfile: {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    specialty: Speciality;
    certification_number: string;
  }) {
    this._id = technicianProfile.id;
    this._user_id = technicianProfile.user_id;
    this._full_name = technicianProfile.full_name;
    this._email = technicianProfile.email;
    this._phone = technicianProfile.phone;
    this._address = technicianProfile.address;
    this._specialty = technicianProfile.specialty;
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
  get email(): string {
    return this._email;
  }
  set email(email: string) {
    this._email = email;
  }
  get phone(): string {
    return this._phone;
  }
  set phone(phone: string) {
    this._phone = phone;
  }
  get address(): string {
    return this._address;
  }
  set address(address: string) {
    this._address = address;
  }
  get specialty(): Speciality {
    return this._specialty;
  }
  set specialty(specialty: Speciality) {
    this._specialty = specialty;
  }
  get certification_number(): string {
    return this._certification_number;
  }
  set certification_number(certification_number: string) {
    this._certification_number = certification_number;
  }
}
