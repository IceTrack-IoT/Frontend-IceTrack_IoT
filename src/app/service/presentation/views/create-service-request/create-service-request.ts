import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { isServiceType, ServiceType } from '@service/domain/value-objects/service-type';
import {
  createServiceRequestsMock,
  MOCK_OWNER_ID,
  SERVICE_EQUIPMENT,
  type ServiceEquipment,
} from '@service/presentation/mocks/service-requests.mock';
import {
  SERVICE_PRIORITY_APPEARANCE,
  SERVICE_STATUS_APPEARANCE,
} from '@service/presentation/service-request-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 500;

type RequestFormControl = 'equipmentId' | 'type' | 'priority' | 'description';

/**
 * Creates a preventive or corrective service request for an equipment item. The `equipmentId`, `type` and
 * `alertId` query parameters prefill a draft, such as a repair drafted from a critical alert; the owner
 * reviews it and confirms the submission. A confirmation summarizes the created request.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Icon, StatusTag],
  selector: 'app-create-service-request',
  styleUrl: './create-service-request.css',
  templateUrl: './create-service-request.html',
})
export class CreateServiceRequest {
  private readonly route = inject(ActivatedRoute);
  protected readonly source = injectMockDataSource();
  protected readonly equipmentOptions = SERVICE_EQUIPMENT;
  protected readonly types = Object.values(ServiceType);
  protected readonly priorities = Object.values(ServicePriority);
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;
  protected readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    equipmentId: [null as number | null, Validators.required],
    type: ['' as ServiceType | '', Validators.required],
    priority: ['' as ServicePriority | '', Validators.required],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(DESCRIPTION_MIN_LENGTH),
        Validators.maxLength(DESCRIPTION_MAX_LENGTH),
      ],
    ],
  });
  private readonly equipmentId = toSignal(this.form.controls.equipmentId.valueChanges, {
    initialValue: null,
  });
  private readonly description = toSignal(this.form.controls.description.valueChanges, {
    initialValue: '',
  });

  /** The alert the draft comes from, when the owner started it from an alert. */
  protected readonly sourceAlertId = this.positiveNumberParam('alertId');
  protected readonly created = signal<ServiceRequest | null>(null);
  private readonly confirmationHeading = viewChild<ElementRef<HTMLElement>>('confirmationHeading');

  protected readonly selectedEquipment = computed(
    () => SERVICE_EQUIPMENT.find((item) => item.id === this.equipmentId()) ?? null,
  );
  protected readonly descriptionLength = computed(() => this.description().length);

  constructor() {
    this.prefill();
    // The form is replaced by the confirmation, so the focus moves to its heading.
    afterRenderEffect(() => this.confirmationHeading()?.nativeElement.focus());
  }

  protected equipmentOf(request: ServiceRequest): ServiceEquipment | null {
    return SERVICE_EQUIPMENT.find((item) => item.id === request.equipment_id) ?? null;
  }

  protected submit(): void {
    if (this.source.pending()) {
      return;
    }
    const { equipmentId, type, priority, description } = this.form.getRawValue();
    const equipment = SERVICE_EQUIPMENT.find((item) => item.id === equipmentId);
    if (this.form.invalid || !equipment || type === '' || priority === '') {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: Delegate to the service requests store (create service request use case).
    this.source.mutate(() => {
      const nextId = Math.max(...createServiceRequestsMock().map((request) => request.id)) + 1;
      this.created.set(
        new ServiceRequest({
          id: nextId,
          owner_id: MOCK_OWNER_ID,
          requester_id: MOCK_OWNER_ID,
          site_id: equipment.siteId,
          equipment_id: equipment.id,
          technician_profile_id: null,
          type,
          priority,
          description: description.trim(),
          status: ServiceStatus.PENDING,
          completed_at: null,
          canceled_at: null,
        }),
      );
    });
  }

  protected createAnother(): void {
    this.form.reset();
    this.created.set(null);
  }

  protected errorKey(name: RequestFormControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return name === 'description'
        ? 'shared.validation.required'
        : 'serviceRequests.form.selectRequired';
    }
    if (control.hasError('minlength')) {
      return 'serviceRequests.form.descriptionTooShort';
    }
    return control.hasError('maxlength') ? 'shared.validation.tooLong' : null;
  }

  private prefill(): void {
    const equipmentId = this.positiveNumberParam('equipmentId');
    if (SERVICE_EQUIPMENT.some((item) => item.id === equipmentId)) {
      this.form.controls.equipmentId.setValue(equipmentId);
    }
    const type = this.route.snapshot.queryParamMap.get('type');
    if (isServiceType(type)) {
      this.form.controls.type.setValue(type);
    }
  }

  private positiveNumberParam(name: string): number | null {
    const value = Number(this.route.snapshot.queryParamMap.get(name));
    return Number.isInteger(value) && value > 0 ? value : null;
  }
}
