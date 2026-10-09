import { BaseEntity } from '@shared/domain/model/base-entity';
import { Phone } from '@assets/domain/value-objects/phone';

/**
 * Represents a site (facility) of an owner where refrigeration equipment is installed.
 */
export class Site implements BaseEntity {
  private _id: number;
  private _owner_id: number;
  private _name: string;
  private _address: string;
  private _contact_name: string;
  private _phone: Phone;
  private _equipment_count: number;

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
  }) {
    this._id = site.id;
    this._owner_id = site.owner_id;
    this._name = site.name;
    this._address = site.address;
    this._contact_name = site.contact_name;
    this._phone = site.phone;
    this._equipment_count = site.equipment_count;
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
}
