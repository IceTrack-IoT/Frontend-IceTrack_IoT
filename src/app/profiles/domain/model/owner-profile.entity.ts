import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * Represents an owner profile entity in the system.
 */
export class OwnerProfile implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _full_name: string;
  private _email: string;
  private _phone: string;
  private _address: string;
  private _ruc: number;

  public constructor(ownerProfile: {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    ruc: number;
  }) {
    this._id = ownerProfile.id;
    this._user_id = ownerProfile.user_id;
    this._full_name = ownerProfile.full_name;
    this._email = ownerProfile.email;
    this._phone = ownerProfile.phone;
    this._address = ownerProfile.address;
    this._ruc = ownerProfile.ruc;
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
  get ruc(): number {
    return this._ruc;
  }
  set ruc(ruc: number) {
    this._ruc = ruc;
  }
}
