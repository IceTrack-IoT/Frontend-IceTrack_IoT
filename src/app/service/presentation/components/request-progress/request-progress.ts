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
 * Progress of a service request along its regular path, with the moments the model records: the start of
 * the intervention and the completion. Rejected and canceled requests leave the path and are shown as a
 * final note.
 */
@Component({
  imports: [TranslatePipe, Icon, LocalizedDatePipe],
  selector: 'app-request-progress',
  styleUrl: './request-progress.css',
  templateUrl: './request-progress.html',
})
export class RequestProgress {
  readonly status = input.required<ServiceStatus>();
  /** When the field intervention started, if it did. */
  readonly startedAt = input<Date | null>(null);
  readonly completedAt = input<Date | null>(null);
  readonly canceledAt = input<Date | null>(null);

  protected readonly rejected = computed(() => this.status() === ServiceStatus.REJECTED);
  protected readonly offPath = computed(
    () => this.status() === ServiceStatus.CANCELED || this.status() === ServiceStatus.REJECTED,
  );
  protected readonly steps = computed(() => {
    const status = this.status();
    const current = PROGRESS_STEPS.indexOf(status);
    return PROGRESS_STEPS.map((step, index) => {
      const state: StepState =
        index < current || status === ServiceStatus.COMPLETED
          ? 'done'
          : index === current
            ? 'current'
            : 'upcoming';
      const time =
        step === ServiceStatus.IN_PROGRESS
          ? this.startedAt()
          : step === ServiceStatus.COMPLETED
            ? this.completedAt()
            : null;
      return { step, state, time, number: index + 1 };
    });
  });
}
