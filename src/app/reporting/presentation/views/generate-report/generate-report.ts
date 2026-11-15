import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
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
import { isReportFormat, ReportFormat } from '@reporting/domain/value-objects/report-format';
import {
  isReportType,
  PERIOD_REPORT_TYPES,
  type ReportType,
} from '@reporting/domain/value-objects/report-type';
import { ReportingStore } from '@reporting/application/reporting-store';
import { REPORT_NAME_MAX_LENGTH } from '@reporting/application/contracts/report-request';
import {
  REPORT_STATUS_APPEARANCE,
  reportRequestErrorKey,
} from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SHELL_LIFETIME } from '@shared/presentation/components/private-layout/shell-lifetime';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';

/** A value with at least one non-blank character, as the backend's `@NotBlank` requires. */
const NOT_BLANK = /\S/;

/** The start of the period must not be after its end. */
const orderedRange: ValidatorFn = (group) => {
  const from: unknown = group.get('from')?.value;
  const to: unknown = group.get('to')?.value;
  return typeof from === 'string' && typeof to === 'string' && from !== '' && to !== '' && from > to
    ? { invalidRange: true }
    : null;
};

type ReportFormControl = 'name' | 'type' | 'from' | 'to';

/**
 * Requests the generation of a report for a period, optionally scoped to a site or an equipment item.
 * Generation is asynchronous: the confirmation shows the request as pending and links to the report,
 * whose detail follows its status. The `type` and `format` query parameters prefill the form, for example
 * to request a failed report again.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Icon, StatusTag],
  selector: 'app-generate-report',
  styleUrl: './generate-report.css',
  templateUrl: './generate-report.html',
})
export class GenerateReport {
  protected readonly store = inject(ReportingStore);
  /** A service document is requested from its completed service request, never from this form. */
  protected readonly types = PERIOD_REPORT_TYPES;
  protected readonly formats = Object.values(ReportFormat);
  protected readonly statusAppearance = REPORT_STATUS_APPEARANCE;
  protected readonly nameMaxLength = REPORT_NAME_MAX_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(NOT_BLANK),
          Validators.maxLength(REPORT_NAME_MAX_LENGTH),
        ],
      ],
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

  private readonly confirmationHeading = viewChild<ElementRef<HTMLElement>>('confirmationHeading');

  /** The report just requested. */
  protected readonly created = computed(() => {
    const state = this.store.requestState();
    return state?.status === 'succeeded' ? state.report : null;
  });
  /** Why the last request failed. */
  protected readonly requestErrorKey = computed(() => {
    const state = this.store.requestState();
    return state?.status === 'failed' ? reportRequestErrorKey(state.failure) : null;
  });
  /** The equipment of the selected site, or all the equipment when no site is selected. */
  protected readonly equipmentOptions = computed(() => {
    const siteId = this.siteId();
    return this.store.equipment().filter((item) => siteId === null || item.siteId === siteId);
  });

  constructor() {
    this.store.attach(inject(DestroyRef), inject(SHELL_LIFETIME));
    this.store.clearRequest();
    this.store.loadScope();
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

  protected retryScope(): void {
    this.store.loadScope();
  }

  protected submit(): void {
    if (this.store.requestPending()) {
      return;
    }
    const { name, type, format, siteId, equipmentId, from, to } = this.form.getRawValue();
    if (this.form.invalid || type === '') {
      this.form.markAllAsTouched();
      return;
    }
    // The period covers whole local days: from the start of the first to the end of the last.
    this.store.requestReport({
      name,
      type,
      format,
      siteId,
      equipmentId,
      technicianId: null,
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T23:59:59.999`),
    });
  }

  protected requestAnother(): void {
    this.store.clearRequest();
    this.form.reset();
  }

  protected errorKey(name: ReportFormControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required') || control.hasError('pattern')) {
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
    if (isReportType(type) && PERIOD_REPORT_TYPES.includes(type)) {
      this.form.controls.type.setValue(type);
    }
    if (isReportFormat(format)) {
      this.form.controls.format.setValue(format);
    }
  }
}
