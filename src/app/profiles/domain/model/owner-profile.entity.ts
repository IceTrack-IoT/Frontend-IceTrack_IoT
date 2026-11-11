import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * Represents an owner profile entity in the system.
 *
 * `id` is the owner profile id and `user_id` the platform account id. `address` is the complete street
 * address composed from its parts (`street`, `number`, `city`, `postal_code`, `country`); the email belongs
 * to the platform account and cannot be changed through the profile. `version` grows on every change and
 * identifies the state an update was made from.
 */
export class OwnerProfile implements BaseEntity {
  private _id: number;
  private _user_id: number;
  private _full_name: string;
  private _email: string;
  private _phone: string;
  private _address: string;
  private _street: string;
  private _number: string | null;
  private _city: string;
  private _postal_code: string;
  private _country: string;
  private _ruc: number;
  private _version: number;

  public constructor(ownerProfile: {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    street: string;
    number: string | null;
    city: string;
    postal_code: string;
    country: string;
    ruc: number;
    version: number;
  }) {
    this._id = ownerProfile.id;
    this._user_id = ownerProfile.user_id;
    this._full_name = ownerProfile.full_name;
    this._email = ownerProfile.email;
    this._phone = ownerProfile.phone;
    this._address = ownerProfile.address;
    this._street = ownerProfile.street;
    this._number = ownerProfile.number;
    this._city = ownerProfile.city;
    this._postal_code = ownerProfile.postal_code;
    this._country = ownerProfile.country;
    this._ruc = ownerProfile.ruc;
    this._version = ownerProfile.version;
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
  get street(): string {
    return this._street;
  }
  set street(street: string) {
    this._street = street;
  }
  /** Street number or apartment, or null when the address has none. */
  get number(): string | null {
    return this._number;
  }
  set number(number: string | null) {
    this._number = number;
  }
  get city(): string {
    return this._city;
  }
  set city(city: string) {
    this._city = city;
  }
  get postal_code(): string {
    return this._postal_code;
  }
  set postal_code(postal_code: string) {
    this._postal_code = postal_code;
  }
  get country(): string {
    return this._country;
  }
  set country(country: string) {
    this._country = country;
  }
  get ruc(): number {
    return this._ruc;
  }
  set ruc(ruc: number) {
    this._ruc = ruc;
  }
  get version(): number {
    return this._version;
  }
  set version(version: number) {
    this._version = version;
  }
}
