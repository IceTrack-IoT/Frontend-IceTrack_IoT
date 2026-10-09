import { BaseEntity } from '@shared/domain/model/base-entity';
import { ServiceType } from '@service/domain/value-objects/service-type';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';

/**
 * Represents a service request of an owner for an equipment item, assigned to a technician.
 *
 * `technician_profile_id` is null until a technician is assigned; `completed_at` and `canceled_at` are null
 * until the request reaches those states.
 */
export class ServiceRequest implements BaseEntity {
  private _id: number;
  private _owner_id: number;
  private _requester_id: number;
  private _site_id: number;
  private _equipment_id: number;
  private _technician_profile_id: number | null;
  private _type: ServiceType;
  private _priority: ServicePriority;
  private _description: string;
  private _status: ServiceStatus;
  private _completed_at: Date | null;
  private _canceled_at: Date | null;

  /**
   * Creates a new instance of the ServiceRequest class.
   *
   * @param serviceRequest - An object containing the properties of the service request.
   */
  public constructor(serviceRequest: {
    id: number;
    owner_id: number;
    requester_id: number;
    site_id: number;
    equipment_id: number;
    technician_profile_id: number | null;
    type: ServiceType;
    priority: ServicePriority;
    description: string;
    status: ServiceStatus;
    completed_at: Date | null;
    canceled_at: Date | null;
  }) {
    this._id = serviceRequest.id;
    this._owner_id = serviceRequest.owner_id;
    this._requester_id = serviceRequest.requester_id;
    this._site_id = serviceRequest.site_id;
    this._equipment_id = serviceRequest.equipment_id;
    this._technician_profile_id = serviceRequest.technician_profile_id;
    this._type = serviceRequest.type;
    this._priority = serviceRequest.priority;
    this._description = serviceRequest.description;
    this._status = serviceRequest.status;
    this._completed_at = serviceRequest.completed_at;
    this._canceled_at = serviceRequest.canceled_at;
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
  get requester_id(): number {
    return this._requester_id;
  }
  set requester_id(requester_id: number) {
    this._requester_id = requester_id;
  }
  get site_id(): number {
    return this._site_id;
  }
  set site_id(site_id: number) {
    this._site_id = site_id;
  }
  get equipment_id(): number {
    return this._equipment_id;
  }
  set equipment_id(equipment_id: number) {
    this._equipment_id = equipment_id;
  }
  get technician_profile_id(): number | null {
    return this._technician_profile_id;
  }
  set technician_profile_id(technician_profile_id: number | null) {
    this._technician_profile_id = technician_profile_id;
  }
  get type(): ServiceType {
    return this._type;
  }
  set type(type: ServiceType) {
    this._type = type;
  }
  get priority(): ServicePriority {
    return this._priority;
  }
  set priority(priority: ServicePriority) {
    this._priority = priority;
  }
  get description(): string {
    return this._description;
  }
  set description(description: string) {
    this._description = description;
  }
  get status(): ServiceStatus {
    return this._status;
  }
  set status(status: ServiceStatus) {
    this._status = status;
  }
  get completed_at(): Date | null {
    return this._completed_at;
  }
  set completed_at(completed_at: Date | null) {
    this._completed_at = completed_at;
  }
  get canceled_at(): Date | null {
    return this._canceled_at;
  }
  set canceled_at(canceled_at: Date | null) {
    this._canceled_at = canceled_at;
  }
}
