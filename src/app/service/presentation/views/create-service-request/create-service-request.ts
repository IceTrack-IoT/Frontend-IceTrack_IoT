import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { isServiceType, ServiceType } from '@service/domain/value-objects/service-type';
import {
  type AlertDraft,
  linkedAlertIdFor,
  SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH,
} from '@service/application/contracts/new-service-request';
import { ServiceRequestsStore } from '@service/application/service-requests-store';
import {
  SERVICE_PRIORITY_APPEARANCE,
  SERVICE_STATUS_APPEARANCE,
} from '@service/presentation/service-request-appearance';
import { createErrorKey } from '@service/presentation/service-requests-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

type RequestFormControl = 'equipmentId' | 'type' | 'priority' | 'description';

/** The states of the equipment options while they are not usable. */
type EquipmentStatus = 'loading' | 'error' | 'empty' | 'ready';

/**
 * Creates a preventive maintenance or repair request for one of the owner's equipment items. The
 * `equipmentId`, `type` and `alertId` query parameters prefill a draft, such as a repair drafted from a
 * critical alert; the owner reviews it and confirms the submission, so no request is created
 * automatically. A confirmation summarizes the created request.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Icon,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
  ],
  selector: 'app-create-service-request',
  styleUrl: './create-service-request.css',
  templateUrl: './create-service-request.html',
})
export class CreateServiceRequest {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(ServiceRequestsStore);
  protected readonly types = Object.values(ServiceType);
  protected readonly priorities = Object.values(ServicePriority);
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;
  protected readonly descriptionMaxLength = SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    equipmentId: [null as number | null, Validators.required],
    type: ['' as ServiceType | '', Validators.required],
    priority: ['' as ServicePriority | '', Validators.required],
    description: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH),
      ],
    ],
  });
  private readonly equipmentId = toSignal(this.form.controls.equipmentId.valueChanges, {
    initialValue: null,
  });
  private readonly description = toSignal(this.form.controls.description.valueChanges, {
    initialValue: '',
  });

  private readonly requestedEquipmentId = this.positiveNumberParam('equipmentId');
  /**
   * The alert the draft comes from, with the equipment it was raised on, when the owner started it from an
   * alert. Without the equipment the alert cannot be linked safely, so there is no draft.
   */
  protected readonly alertDraft = this.alertDraftOf(
    this.positiveNumberParam('alertId'),
    this.requestedEquipmentId,
  );
  /** Whether another equipment item than the one the alert was raised on is selected. */
  protected readonly alertMismatch = computed(() => {
    const equipmentId = this.equipmentId();
    return (
      this.alertDraft !== null &&
      equipmentId !== null &&
      equipmentId !== this.alertDraft.equipmentId
    );
  });
  private readonly confirmationHeading = viewChild<ElementRef<HTMLElement>>('confirmationHeading');

  protected readonly equipmentStatus = computed<EquipmentStatus>(() => {
    if (!this.store.equipmentLoaded()) {
      return this.store.equipmentFailure() !== null && !this.store.equipmentLoading()
        ? 'error'
        : 'loading';
    }
    return this.store.equipment().length === 0 ? 'empty' : 'ready';
  });
  protected readonly selectedEquipment = computed(() => {
    const equipmentId = this.equipmentId();
    return equipmentId === null ? null : (this.store.equipmentById().get(equipmentId) ?? null);
  });
  protected readonly selectedSiteName = computed(() => {
    const equipment = this.selectedEquipment();
    return equipment === null ? null : (this.store.siteById().get(equipment.siteId)?.name ?? null);
  });
  protected readonly descriptionLength = computed(() => this.description().length);
  protected readonly createErrorKey = computed(() =>
    createErrorKey(
      this.store.createFailure(),
      linkedAlertIdFor(this.alertDraft, this.equipmentId()) !== null,
    ),
  );

  constructor() {
    this.store.clearCreation();
    this.store.loadEquipmentDirectory();
    this.prefillType();
    // The equipment of the draft is selected once the owner's equipment is known to include it.
    let prefilled = false;
    effect(() => {
      if (prefilled || !this.store.equipmentLoaded()) {
        return;
      }
      prefilled = true;
      const equipmentId = this.requestedEquipmentId;
      untracked(() => {
        if (equipmentId !== null && this.store.equipmentById().has(equipmentId)) {
          this.form.controls.equipmentId.setValue(equipmentId);
        }
      });
    });
    // The form is replaced by the confirmation, so the focus moves to its heading.
    afterRenderEffect(() => this.confirmationHeading()?.nativeElement.focus());
  }

  protected submit(): void {
    if (this.store.creating()) {
      return;
    }
    const { equipmentId, type, priority, description } = this.form.getRawValue();
    if (this.form.invalid || equipmentId === null || type === '' || priority === '') {
      this.form.markAllAsTouched();
      return;
    }
    this.store.createServiceRequest({
      equipmentId,
      type,
      priority,
      description,
      // The alert belongs to the drafted equipment; another equipment item is a request of its own.
      sourceAlertId: linkedAlertIdFor(this.alertDraft, equipmentId),
    });
  }

  protected createAnother(): void {
    this.form.reset();
    this.store.clearCreation();
  }

  protected reloadEquipment(): void {
    this.store.loadEquipmentDirectory();
  }

  protected errorKey(name: RequestFormControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) {
      return null;
    }
    if (control.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return name === 'description'
      ? 'shared.validation.required'
      : 'serviceRequests.form.selectRequired';
  }

  private prefillType(): void {
    const type = this.route.snapshot.queryParamMap.get('type');
    if (isServiceType(type)) {
      this.form.controls.type.setValue(type);
    }
  }

  private alertDraftOf(alertId: number | null, equipmentId: number | null): AlertDraft | null {
    return alertId === null || equipmentId === null ? null : { alertId, equipmentId };
  }

  private positiveNumberParam(name: string): number | null {
    const value = Number(this.route.snapshot.queryParamMap.get(name));
    return Number.isInteger(value) && value > 0 ? value : null;
  }
}
