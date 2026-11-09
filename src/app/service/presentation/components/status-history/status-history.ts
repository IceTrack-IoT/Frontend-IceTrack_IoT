import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  isTechnicianTransition,
  type StatusTransition,
  transitionKindOf,
} from '@service/domain/value-objects/status-transition';
import type { TechnicianSummary } from '@service/application/contracts/technician-candidate';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/**
 * Status history of a service request, newest first: what happened, when, who acted and why, for
 * rejections and cancellations. Technicians are named from the directory when it is available.
 */
@Component({
  imports: [TranslatePipe, LocalizedDatePipe],
  selector: 'app-status-history',
  styleUrl: './status-history.css',
  templateUrl: './status-history.html',
})
export class StatusHistory {
  /** The status history, oldest first, as the backend returns it. */
  readonly history = input.required<readonly StatusTransition[]>();
  readonly technicianById = input<ReadonlyMap<number, TechnicianSummary>>(new Map());

  protected readonly entries = computed(() =>
    this.history()
      .map((transition, index) => {
        const kind = transitionKindOf(transition);
        const technicianId = transition.technician_id;
        return {
          key: index,
          kind,
          occurredAt: transition.occurred_at,
          reason: transition.reason,
          byTechnician: isTechnicianTransition(kind),
          technicianId,
          technicianName:
            technicianId === null ? null : (this.technicianById().get(technicianId)?.fullName ?? null),
        };
      })
      .reverse(),
  );
}
