import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Intervention } from '@service/domain/model/intervention.entity';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/**
 * The technical report of an intervention, read-only: when it happened, who did it, the diagnosis, the
 * actions taken, the spare parts, how long it took and the photo evidence. Only `https` photo references
 * are offered as links, because the backend validates neither their scheme nor their host.
 */
@Component({
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe],
  selector: 'app-intervention-summary',
  styleUrl: './intervention-summary.css',
  templateUrl: './intervention-summary.html',
})
export class InterventionSummary {
  readonly intervention = input.required<Intervention>();
  /** The name of the technician, or null when it is not known. */
  readonly technicianName = input<string | null>(null);
  /** Whether to link to the service request the intervention completed. */
  readonly showRequestLink = input(false);

  protected readonly duration = computed(() => {
    const seconds = this.intervention().duration_seconds;
    if (seconds === null || seconds < 0) {
      return null;
    }
    const totalMinutes = Math.round(seconds / 60);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  });

  protected readonly photos = computed(() =>
    this.intervention().photo_evidence.map((reference, index) => ({
      key: index,
      number: index + 1,
      url: isSecureUrl(reference) ? reference : null,
    })),
  );
}

function isSecureUrl(reference: string): boolean {
  try {
    return new URL(reference).protocol === 'https:';
  } catch {
    return false;
  }
}
