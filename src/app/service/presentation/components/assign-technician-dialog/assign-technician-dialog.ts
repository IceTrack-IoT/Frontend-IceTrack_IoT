import { Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { TechnicianCandidate } from '@service/application/contracts/technician-candidate';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/** Filter value that keeps every speciality. */
const ALL_SPECIALITIES = '';

/**
 * Lets the owner pick the technician to assign to a service request from the read-only profile data
 * needed to decide (speciality, certification number, average rating and completed services), then
 * confirm the assignment. A technician whose profile is unavailable cannot be picked.
 */
@Component({
  imports: [TranslatePipe, Dialog, Icon, StatePanel, LocalizedNumberPipe],
  selector: 'app-assign-technician-dialog',
  styleUrl: './assign-technician-dialog.css',
  templateUrl: './assign-technician-dialog.html',
})
export class AssignTechnicianDialog {
  /** The translated description of the service request. */
  readonly requestLabel = input.required<string>();
  readonly candidates = input.required<readonly TechnicianCandidate[]>();
  /** Whether the candidates are being loaded. */
  readonly loading = input(false);
  /** Whether the candidates could not be loaded. */
  readonly failed = input(false);
  /** The technician currently assigned, if any. */
  readonly currentTechnicianId = input<number | null>(null);
  /** Whether the assignment is in progress. */
  readonly pending = input(false);
  /** The translation key of the last failure of the assignment, if any. */
  readonly errorKey = input<string | null>(null);
  readonly assigned = output<number>();
  readonly retry = output<void>();
  readonly closed = output<void>();

  protected readonly allSpecialities = ALL_SPECIALITIES;
  protected readonly speciality = signal(ALL_SPECIALITIES);
  /** The technician the owner picked, if any. */
  protected readonly selectedId = signal<number | null>(null);
  /** Whether the owner tried to continue, so a missing choice is reported. */
  protected readonly attempted = signal(false);
  /** Whether the owner is confirming the chosen technician. */
  protected readonly confirming = signal(false);

  /** The specialities the candidates declare, a free text, sorted. */
  protected readonly specialities = computed(() =>
    [...new Set(this.candidates().map((candidate) => candidate.speciality.trim()))]
      .filter((speciality) => speciality !== '')
      .sort((first, second) => first.localeCompare(second)),
  );

  protected readonly visible = computed(() => {
    const speciality = this.speciality();
    return this.candidates().filter(
      (candidate) => speciality === ALL_SPECIALITIES || candidate.speciality.trim() === speciality,
    );
  });

  protected readonly chosen = computed(
    () =>
      this.candidates().find((candidate) => candidate.technicianId === this.selectedId()) ?? null,
  );

  protected select(candidate: TechnicianCandidate): void {
    if (candidate.profileAvailable) {
      this.selectedId.set(candidate.technicianId);
    }
  }

  protected review(): void {
    const candidate = this.chosen();
    if (candidate === null || !candidate.profileAvailable) {
      this.attempted.set(true);
      return;
    }
    this.confirming.set(true);
  }

  protected confirm(): void {
    const candidate = this.chosen();
    if (this.pending() || candidate === null || !candidate.profileAvailable) {
      return;
    }
    this.assigned.emit(candidate.technicianId);
  }
}
