import { BaseEntity } from '@shared/domain/model/base-entity';
import { Intervention } from '@service/domain/model/intervention.entity';
import { MaintenanceWindowLink } from '@service/domain/value-objects/maintenance-window-link';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { ServiceType } from '@service/domain/value-objects/service-type';
import {
  StatusTransition,
  transitionKindOf,
} from '@service/domain/value-objects/status-transition';

/** The statuses in which the owner may cancel a request or assign a technician to it. */
const OPEN_STATUSES: ReadonlySet<ServiceStatus> = new Set([
  ServiceStatus.PENDING,
  ServiceStatus.ACCEPTED,
]);

/**
 * Represents a maintenance or repair request of an owner for one of its equipment items.
 *
 * It starts PENDING without a technician. `technician_id` is null while none is assigned; the moments of
 * each step are null until the request reaches it. The status history travels with the request, oldest
 * first, starting with the creation. `equipment_name`, `site_name` and `technician_name` are the display
 * names at the time of the read, null when no longer known (or, for the technician, while unassigned).
 * `source_alert_id` is the alert a corrective request was opened for.
 */
export class ServiceRequest implements BaseEntity {
  private readonly _id: number;
  private readonly _owner_id: number;
  private readonly _equipment_id: number;
  private readonly _site_id: number;
  private readonly _technician_id: number | null;
  private readonly _type: ServiceType;
  private readonly _priority: ServicePriority;
  private readonly _description: string;
  private readonly _status: ServiceStatus;
  private readonly _created_at: Date;
  private readonly _assigned_at: Date | null;
  private readonly _started_at: Date | null;
  private readonly _completed_at: Date | null;
  private readonly _canceled_at: Date | null;
  private readonly _cancel_reason: string | null;
  private readonly _history: readonly StatusTransition[];
  private readonly _intervention: Intervention | null;
  private readonly _maintenance_windows: readonly MaintenanceWindowLink[];
  private readonly _equipment_name: string | null;
  private readonly _site_name: string | null;
  private readonly _technician_name: string | null;
  private readonly _source_alert_id: number | null;

  /**
   * @param serviceRequest - An object containing the properties of the service request.
   */
  public constructor(serviceRequest: {
    id: number;
    owner_id: number;
    equipment_id: number;
    site_id: number;
    technician_id: number | null;
    type: ServiceType;
    priority: ServicePriority;
    description: string;
    status: ServiceStatus;
    created_at: Date;
    assigned_at: Date | null;
    started_at: Date | null;
    completed_at: Date | null;
    canceled_at: Date | null;
    cancel_reason: string | null;
    history: readonly StatusTransition[];
    intervention: Intervention | null;
    maintenance_windows: readonly MaintenanceWindowLink[];
    equipment_name: string | null;
    site_name: string | null;
    technician_name: string | null;
    source_alert_id: number | null;
  }) {
    this._id = serviceRequest.id;
    this._owner_id = serviceRequest.owner_id;
    this._equipment_id = serviceRequest.equipment_id;
    this._site_id = serviceRequest.site_id;
    this._technician_id = serviceRequest.technician_id;
    this._type = serviceRequest.type;
    this._priority = serviceRequest.priority;
    this._description = serviceRequest.description;
    this._status = serviceRequest.status;
    this._created_at = serviceRequest.created_at;
    this._assigned_at = serviceRequest.assigned_at;
    this._started_at = serviceRequest.started_at;
    this._completed_at = serviceRequest.completed_at;
    this._canceled_at = serviceRequest.canceled_at;
    this._cancel_reason = serviceRequest.cancel_reason;
    this._history = serviceRequest.history;
    this._intervention = serviceRequest.intervention;
    this._maintenance_windows = serviceRequest.maintenance_windows;
    this._equipment_name = serviceRequest.equipment_name;
    this._site_name = serviceRequest.site_name;
    this._technician_name = serviceRequest.technician_name;
    this._source_alert_id = serviceRequest.source_alert_id;
  }

  get id(): number {
    return this._id;
  }
  /** The owner profile that created the request. */
  get owner_id(): number {
    return this._owner_id;
  }
  get equipment_id(): number {
    return this._equipment_id;
  }
  /** The site the equipment is installed at. */
  get site_id(): number {
    return this._site_id;
  }
  /** The assigned technician profile, or null while none is assigned. */
  get technician_id(): number | null {
    return this._technician_id;
  }
  get type(): ServiceType {
    return this._type;
  }
  get priority(): ServicePriority {
    return this._priority;
  }
  get description(): string {
    return this._description;
  }
  get status(): ServiceStatus {
    return this._status;
  }
  get created_at(): Date {
    return this._created_at;
  }
  /** When the current technician was assigned. */
  get assigned_at(): Date | null {
    return this._assigned_at;
  }
  get started_at(): Date | null {
    return this._started_at;
  }
  get completed_at(): Date | null {
    return this._completed_at;
  }
  get canceled_at(): Date | null {
    return this._canceled_at;
  }
  get cancel_reason(): string | null {
    return this._cancel_reason;
  }
  /** The status history, oldest first; the first entry is the creation. */
  get history(): readonly StatusTransition[] {
    return this._history;
  }
  /** The intervention that completed the request, or null until it is completed. */
  get intervention(): Intervention | null {
    return this._intervention;
  }
  /** The maintenance windows opened on the equipment while the work was in progress, oldest first. */
  get maintenance_windows(): readonly MaintenanceWindowLink[] {
    return this._maintenance_windows;
  }
  get equipment_name(): string | null {
    return this._equipment_name;
  }
  get site_name(): string | null {
    return this._site_name;
  }
  /** The full name of the assigned technician, or null while none is assigned. */
  get technician_name(): string | null {
    return this._technician_name;
  }
  /** The alert a corrective request was opened for, or null when none. */
  get source_alert_id(): number | null {
    return this._source_alert_id;
  }

  /**
   * Whether the owner may cancel the request: only while it is PENDING or ACCEPTED. The backend remains
   * the authority and rejects other moves with `INVALID_STATUS_TRANSITION`.
   */
  canBeCanceled(): boolean {
    return OPEN_STATUSES.has(this._status);
  }

  /**
   * Whether the owner may assign (or replace) the technician: only while the request is PENDING or
   * ACCEPTED. A new assignment sends the request back to PENDING until the technician accepts it.
   */
  canBeAssigned(): boolean {
    return OPEN_STATUSES.has(this._status);
  }

  /** Whether the owner may review the technician: only once the request is COMPLETED. */
  canBeReviewed(): boolean {
    return this._status === ServiceStatus.COMPLETED;
  }

  /** Whether a technician is assigned and has not accepted the request yet. */
  isAwaitingAcceptance(): boolean {
    return this._status === ServiceStatus.PENDING && this._technician_id !== null;
  }

  /**
   * Whether the last technician rejected the request, which stays PENDING without a technician until the
   * owner assigns another one.
   */
  wasRejected(): boolean {
    const last = this._history.at(-1);
    return (
      this._status === ServiceStatus.PENDING &&
      this._technician_id === null &&
      last !== undefined &&
      transitionKindOf(last) === 'REJECTED'
    );
  }

  /** When the request last reached a status, according to its history, or null if it never did. */
  reachedAt(status: ServiceStatus): Date | null {
    for (let index = this._history.length - 1; index >= 0; index--) {
      if (this._history[index].to_status === status) {
        return this._history[index].occurred_at;
      }
    }
    return null;
  }
}
