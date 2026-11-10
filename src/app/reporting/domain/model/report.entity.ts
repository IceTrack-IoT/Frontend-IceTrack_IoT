import { BaseEntity } from '@shared/domain/model/base-entity';
import type { KpiValue } from '@reporting/domain/value-objects/kpi-value';
import { ReportFormat } from '@reporting/domain/value-objects/report-format';
import type { ReportFilters } from '@reporting/domain/value-objects/report-filters';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import { ReportType } from '@reporting/domain/value-objects/report-type';

/**
 * Represents a report requested by the owner. It is generated in the background: it starts PENDING, moves
 * to GENERATING and ends COMPLETED or FAILED.
 *
 * `kpis` holds the indicators of a COMPLETED report (from the backend `result_payload`) and is null
 * otherwise; `failure_reason` explains a FAILED report; `completed_at` is set once it reaches COMPLETED or
 * FAILED. The download link of the file is never part of the model: it is a short-lived signed URL read on
 * demand.
 */
export class Report implements BaseEntity {
  private _id: number;
  private _name: string;
  private _type: ReportType;
  private _format: ReportFormat;
  private _status: ReportStatus;
  private _failure_reason: string | null;
  private _kpis: readonly KpiValue[] | null;
  private _user_id: number;
  private _filters: ReportFilters;
  private _requested_at: Date;
  private _completed_at: Date | null;

  /**
   * Creates a new instance of the Report class.
   * @param report - An object containing the properties of the report.
   */
  public constructor(report: {
    id: number;
    name: string;
    type: ReportType;
    format: ReportFormat;
    status: ReportStatus;
    failure_reason: string | null;
    kpis: readonly KpiValue[] | null;
    user_id: number;
    filters: ReportFilters;
    requested_at: Date;
    completed_at: Date | null;
  }) {
    this._id = report.id;
    this._name = report.name;
    this._type = report.type;
    this._format = report.format;
    this._status = report.status;
    this._failure_reason = report.failure_reason;
    this._kpis = report.kpis;
    this._user_id = report.user_id;
    this._filters = report.filters;
    this._requested_at = report.requested_at;
    this._completed_at = report.completed_at;
  }

  get id(): number {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get type(): ReportType {
    return this._type;
  }
  get format(): ReportFormat {
    return this._format;
  }
  get status(): ReportStatus {
    return this._status;
  }
  get failure_reason(): string | null {
    return this._failure_reason;
  }
  get kpis(): readonly KpiValue[] | null {
    return this._kpis;
  }
  get user_id(): number {
    return this._user_id;
  }
  get filters(): ReportFilters {
    return this._filters;
  }
  get requested_at(): Date {
    return this._requested_at;
  }
  get completed_at(): Date | null {
    return this._completed_at;
  }

  /**
   * Whether the report is still waiting for or undergoing generation.
   * @returns True while PENDING or GENERATING.
   */
  isInProgress(): boolean {
    return this._status === ReportStatus.PENDING || this._status === ReportStatus.GENERATING;
  }

  /**
   * Whether the report file can be downloaded.
   * @returns True once COMPLETED.
   */
  isDownloadable(): boolean {
    return this._status === ReportStatus.COMPLETED;
  }
}
