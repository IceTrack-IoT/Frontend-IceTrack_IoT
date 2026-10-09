import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Report } from '@reporting/domain/model/report.entity';
import { isReportFormat, ReportFormat } from '@reporting/domain/value-objects/report-format';
import { isReportType, ReportType } from '@reporting/domain/value-objects/report-type';
import {
  REPORT_EQUIPMENT,
  REPORT_SITES,
  requestReportMock,
} from '@reporting/presentation/mocks/reporting.mock';
import { REPORT_STATUS_APPEARANCE } from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';

const TITLE_MAX_LENGTH = 120;

/** The start of the period must not be after its end. */
const orderedRange: ValidatorFn = (group) => {
  const from: unknown = group.get('from')?.value;
  const to: unknown = group.get('to')?.value;
  return typeof from === 'string' && typeof to === 'string' && from !== '' && to !== '' && from > to
    ? { invalidRange: true }
    : null;
};

type ReportFormControl = 'title' | 'type' | 'from' | 'to';

/**
 * Requests the generation of a report for a period, optionally scoped to a site or an equipment item.
 * Generation is asynchronous: the confirmation shows the request as pending. The `type` and `format`
 * query parameters prefill the form, for example to request a failed report again.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Icon, StatusTag],
  selector: 'app-generate-report',
  styleUrl: './generate-report.css',
  templateUrl: './generate-report.html',
})
export class GenerateReport {
  protected readonly source = injectMockDataSource();
  protected readonly types = Object.values(ReportType);
  protected readonly formats = Object.values(ReportFormat);
  protected readonly sites = REPORT_SITES;
  protected readonly statusAppearance = REPORT_STATUS_APPEARANCE;
  protected readonly titleMaxLength = TITLE_MAX_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      title: ['', [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH)]],
      type: ['' as ReportType | '', Validators.required],
      format: [ReportFormat.PDF as ReportFormat, Validators.required],
      siteId: [null as number | null],
      equipmentId: [null as number | null],
      from: ['', Validators.required],
      to: ['', Validators.required],
    },
    { validators: orderedRange },
  );
  private readonly siteId = toSignal(this.form.controls.siteId.valueChanges, {
    initialValue: null,
  });

  protected readonly created = signal<Report | null>(null);
  private readonly confirmationHeading = viewChild<ElementRef<HTMLElement>>('confirmationHeading');

  /** The equipment of the selected site, or all the equipment when no site is selected. */
  protected readonly equipmentOptions = computed(() => {
    const siteId = this.siteId();
    return REPORT_EQUIPMENT.filter((item) => siteId === null || item.siteId === siteId);
  });

  constructor() {
    this.prefill(inject(ActivatedRoute));
    // An equipment item of another site no longer fits the scope.
    this.form.controls.siteId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const equipmentId = this.form.controls.equipmentId.value;
      if (!this.equipmentOptions().some((item) => item.id === equipmentId)) {
        this.form.controls.equipmentId.setValue(null);
      }
    });
    // The form is replaced by the confirmation, so the focus moves to its heading.
    afterRenderEffect(() => this.confirmationHeading()?.nativeElement.focus());
  }

  protected submit(): void {
    if (this.source.pending()) {
      return;
    }
    const { title, type, format, siteId, equipmentId, from, to } = this.form.getRawValue();
    if (this.form.invalid || type === '') {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: Delegate to the reporting store (generate report use case).
    this.source.mutate(() => {
      this.created.set(
        requestReportMock({
          title: title.trim(),
          type,
          format,
          filters: {
            site_id: siteId,
            equipment_id: equipmentId,
            date_range: { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) },
          },
        }),
      );
    });
  }

  protected requestAnother(): void {
    this.form.reset();
    this.created.set(null);
  }

  protected errorKey(name: ReportFormControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return name === 'type' ? 'reporting.form.typeRequired' : 'shared.validation.required';
    }
    if (control.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return name === 'to' && this.form.hasError('invalidRange')
      ? 'reporting.validation.invalidRange'
      : null;
  }

  private prefill(route: ActivatedRoute): void {
    const params = route.snapshot.queryParamMap;
    const type = params.get('type');
    const format = params.get('format');
    if (isReportType(type)) {
      this.form.controls.type.setValue(type);
    }
    if (isReportFormat(format)) {
      this.form.controls.format.setValue(format);
    }
  }
}
