import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Speciality } from '@profiles/domain/value-objects/speciality';
import type { TechnicianCandidate } from '@service/presentation/mocks/service-requests.mock';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

type SpecialtyFilter = Speciality | 'ALL';

/**
 * Lets the owner pick the technician to assign to a service request from the read-only profile data
 * needed to decide: specialty, certification number, average rating and completed services.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon, LocalizedNumberPipe],
  selector: 'app-assign-technician-dialog',
  styleUrl: './assign-technician-dialog.css',
  templateUrl: './assign-technician-dialog.html',
})
export class AssignTechnicianDialog {
  /** The translated description of the service request. */
  readonly requestLabel = input.required<string>();
  readonly candidates = input.required<readonly TechnicianCandidate[]>();
  /** The technician currently assigned, if any. */
  readonly currentTechnicianId = input<number | null>(null);
  /** Whether the assignment is in progress. */
  readonly pending = input(false);
  readonly assigned = output<number>();
  readonly closed = output<void>();

  protected readonly specialtyFilters: SpecialtyFilter[] = ['ALL', ...Object.values(Speciality)];
  protected readonly specialty = signal<SpecialtyFilter>('ALL');
  protected readonly selection = new FormControl<number | null>(null, Validators.required);

  protected readonly visible = computed(() => {
    const specialty = this.specialty();
    return this.candidates().filter(
      (candidate) => specialty === 'ALL' || candidate.specialty === specialty,
    );
  });

  protected confirm(): void {
    if (this.pending()) {
      return;
    }
    const technicianId = this.selection.value;
    if (technicianId === null) {
      this.selection.markAsTouched();
      return;
    }
    this.assigned.emit(technicianId);
  }
}
