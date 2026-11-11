import { BaseEntity } from '@shared/domain/model/base-entity';
import type { GeoLocation } from '@assets/domain/value-objects/geo-location';
import type { GeocodingFailureReason } from '@assets/domain/value-objects/geocoding-failure-reason';
import { GeocodingStatus } from '@assets/domain/value-objects/geocoding-status';
import { Phone } from '@assets/domain/value-objects/phone';

/**
 * Represents a site (facility) of an owner where refrigeration equipment is installed.
 *
 * Its address only changes through a verified address. `location` and `navigation_url` are null unless the
 * site is located (`geocoding_status` RESOLVED); `geocoding_failure_reason` tells why it could not be
 * located and is null unless the status is FAILED or NOT_FOUND. `version` grows on every change and
 * identifies the state an update was made from.
 */
export class Site implements BaseEntity {
  private _id: number;
  private _owner_id: number;
  private _name: string;
  private _address: string;
  private _contact_name: string;
  private _phone: Phone;
  private _equipment_count: number;
  private _geocoding_status: GeocodingStatus;
  private _location: GeoLocation | null;
  private _navigation_url: string | null;
  private _geocoding_failure_reason: GeocodingFailureReason | null;
  private _version: number;

  /**
   * Creates a new instance of the Site class.
   *
   * @param site - An object containing the properties of the site.
   */
  public constructor(site: {
    id: number;
    owner_id: number;
    name: string;
    address: string;
    contact_name: string;
    phone: Phone;
    equipment_count: number;
    geocoding_status: GeocodingStatus;
    location: GeoLocation | null;
    navigation_url: string | null;
    geocoding_failure_reason: GeocodingFailureReason | null;
    version: number;
  }) {
    this._id = site.id;
    this._owner_id = site.owner_id;
    this._name = site.name;
    this._address = site.address;
    this._contact_name = site.contact_name;
    this._phone = site.phone;
    this._equipment_count = site.equipment_count;
    this._geocoding_status = site.geocoding_status;
    this._location = site.location;
    this._navigation_url = site.navigation_url;
    this._geocoding_failure_reason = site.geocoding_failure_reason;
    this._version = site.version;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get owner_id(): number {
    return this._owner_id;
  }
  set owner_id(owner_id: number) {
    this._owner_id = owner_id;
  }
  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._name = name;
  }
  get address(): string {
    return this._address;
  }
  set address(address: string) {
    this._address = address;
  }
  get contact_name(): string {
    return this._contact_name;
  }
  set contact_name(contact_name: string) {
    this._contact_name = contact_name;
  }
  get phone(): Phone {
    return this._phone;
  }
  set phone(phone: Phone) {
    this._phone = phone;
  }
  get equipment_count(): number {
    return this._equipment_count;
  }
  set equipment_count(equipment_count: number) {
    this._equipment_count = equipment_count;
  }
  get geocoding_status(): GeocodingStatus {
    return this._geocoding_status;
  }
  set geocoding_status(geocoding_status: GeocodingStatus) {
    this._geocoding_status = geocoding_status;
  }
  get location(): GeoLocation | null {
    return this._location;
  }
  set location(location: GeoLocation | null) {
    this._location = location;
  }
  get navigation_url(): string | null {
    return this._navigation_url;
  }
  set navigation_url(navigation_url: string | null) {
    this._navigation_url = navigation_url;
  }
  get geocoding_failure_reason(): GeocodingFailureReason | null {
    return this._geocoding_failure_reason;
  }
  set geocoding_failure_reason(geocoding_failure_reason: GeocodingFailureReason | null) {
    this._geocoding_failure_reason = geocoding_failure_reason;
  }
  get version(): number {
    return this._version;
  }
  set version(version: number) {
    this._version = version;
  }
}
