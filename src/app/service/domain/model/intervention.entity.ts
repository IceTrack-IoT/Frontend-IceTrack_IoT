import { BaseEntity } from '@shared/domain/model/base-entity';
import { InterventionStatus } from '@service/domain/value-objects/intervention-status';

/**
 * Represents the field intervention of a technician that fulfills a service request.
 *
 * `start_time` and `end_time` are null until the intervention starts and ends.
 */
export class Intervention implements BaseEntity<string> {
  private _id: string;
  private _service_request_id: number;
  private _intervention_status: InterventionStatus;
  private _summary: string;
  private _start_time: Date | null;
  private _end_time: Date | null;

  /**
   * Creates a new instance of the Intervention class.
   *
   * @param intervention - An object containing the properties of the intervention.
   */
  public constructor(intervention: {
    id: string;
    service_request_id: number;
    intervention_status: InterventionStatus;
    summary: string;
    start_time: Date | null;
    end_time: Date | null;
  }) {
    this._id = intervention.id;
    this._service_request_id = intervention.service_request_id;
    this._intervention_status = intervention.intervention_status;
    this._summary = intervention.summary;
    this._start_time = intervention.start_time;
    this._end_time = intervention.end_time;
  }

  get id(): string {
    return this._id;
  }
  set id(id: string) {
    this._id = id;
  }
  get service_request_id(): number {
    return this._service_request_id;
  }
  set service_request_id(service_request_id: number) {
    this._service_request_id = service_request_id;
  }
  get intervention_status(): InterventionStatus {
    return this._intervention_status;
  }
  set intervention_status(intervention_status: InterventionStatus) {
    this._intervention_status = intervention_status;
  }
  get summary(): string {
    return this._summary;
  }
  set summary(summary: string) {
    this._summary = summary;
  }
  get start_time(): Date | null {
    return this._start_time;
  }
  set start_time(start_time: Date | null) {
    this._start_time = start_time;
  }
  get end_time(): Date | null {
    return this._end_time;
  }
  set end_time(end_time: Date | null) {
    this._end_time = end_time;
  }
}
