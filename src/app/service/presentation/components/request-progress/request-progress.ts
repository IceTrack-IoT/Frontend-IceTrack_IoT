import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/** The regular path of a service request, from creation to completion. */
const PROGRESS_STEPS: readonly ServiceStatus[] = [
  ServiceStatus.PENDING,
  ServiceStatus.ACCEPTED,
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.COMPLETED,
];

type StepState = 'done' | 'current' | 'upcoming';

/**
 * Progress of a service request along its regular path, with the moment each step was reached. A canceled
 * request leaves the path and is shown as a final note with its reason.
 */
@Component({
  imports: [TranslatePipe, Icon, LocalizedDatePipe],
  selector: 'app-request-progress',
  styleUrl: './request-progress.css',
  templateUrl: './request-progress.html',
})
export class RequestProgress {
  readonly status = input.required<ServiceStatus>();
  /** When the request was created. */
  readonly createdAt = input<Date | null>(null);
  /** When the technician last accepted the request, if it did. */
  readonly acceptedAt = input<Date | null>(null);
  readonly startedAt = input<Date | null>(null);
  readonly completedAt = input<Date | null>(null);
  readonly canceledAt = input<Date | null>(null);
  readonly cancelReason = input<string | null>(null);

  protected readonly canceled = computed(() => this.status() === ServiceStatus.CANCELED);
  protected readonly steps = computed(() => {
    const status = this.status();
    const current = PROGRESS_STEPS.indexOf(status);
    const times: Readonly<Record<string, Date | null>> = {
      [ServiceStatus.PENDING]: this.createdAt(),
      [ServiceStatus.ACCEPTED]: this.acceptedAt(),
      [ServiceStatus.IN_PROGRESS]: this.startedAt(),
      [ServiceStatus.COMPLETED]: this.completedAt(),
    };
    return PROGRESS_STEPS.map((step, index) => {
      const state: StepState =
        index < current || status === ServiceStatus.COMPLETED
          ? 'done'
          : index === current
            ? 'current'
            : 'upcoming';
      // A step not reached yet shows no time, even if an earlier assignment reached it before.
      const time = state === 'upcoming' ? null : times[step];
      return { step, state, time, number: index + 1 };
    });
  });
}
