import { BaseEntity } from '@shared/domain/model/base-entity';
import { ReportType } from '@reporting/domain/value-objects/report-type';
import { ReportFormat } from '@reporting/domain/value-objects/report-format';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';

/**
 * Represents an analytical report requested by a user and generated asynchronously.
 *
 * `result_payload` and `completed_at` are null until the generation completes.
 */
export class Report implements BaseEntity {
  private _id: number;
  private _title: string;
  private _type: ReportType;
  private _format: ReportFormat;
  private _status: ReportStatus;
  private _result_payload: string | null;
  private _user_id: number;
  private _requested_at: Date;
  private _completed_at: Date | null;

  /**
   * Creates a new instance of the Report class.
   *
   * @param report - An object containing the properties of the report.
   */
  public constructor(report: {
    id: number;
    title: string;
    type: ReportType;
    format: ReportFormat;
    status: ReportStatus;
    result_payload: string | null;
    user_id: number;
    requested_at: Date;
    completed_at: Date | null;
  }) {
    this._id = report.id;
    this._title = report.title;
    this._type = report.type;
    this._format = report.format;
    this._status = report.status;
    this._result_payload = report.result_payload;
    this._user_id = report.user_id;
    this._requested_at = report.requested_at;
    this._completed_at = report.completed_at;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get title(): string {
    return this._title;
  }
  set title(title: string) {
    this._title = title;
  }
  get type(): ReportType {
    return this._type;
  }
  set type(type: ReportType) {
    this._type = type;
  }
  get format(): ReportFormat {
    return this._format;
  }
  set format(format: ReportFormat) {
    this._format = format;
  }
  get status(): ReportStatus {
    return this._status;
  }
  set status(status: ReportStatus) {
    this._status = status;
  }
  get result_payload(): string | null {
    return this._result_payload;
  }
  set result_payload(result_payload: string | null) {
    this._result_payload = result_payload;
  }
  get user_id(): number {
    return this._user_id;
  }
  set user_id(user_id: number) {
    this._user_id = user_id;
  }
  get requested_at(): Date {
    return this._requested_at;
  }
  set requested_at(requested_at: Date) {
    this._requested_at = requested_at;
  }
  get completed_at(): Date | null {
    return this._completed_at;
  }
  set completed_at(completed_at: Date | null) {
    this._completed_at = completed_at;
  }
}
