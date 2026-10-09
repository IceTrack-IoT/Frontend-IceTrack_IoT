import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import type { ReviewRating } from '@service/domain/value-objects/review-rating';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/** The review of a completed service as collected by the dialog. */
export interface ReviewSubmission {
  readonly rating: ReviewRating;
  readonly comment: string;
}

type RatingCriterion = keyof ReviewRating;

const CRITERIA: readonly RatingCriterion[] = ['communication', 'efficacy', 'performance'];
const SCORES = [1, 2, 3, 4, 5] as const;
const COMMENT_MAX_LENGTH = 500;

/**
 * Review of the technician who completed a service: a score from 1 to 5 for each criterion, chosen with
 * radio buttons, and an optional comment.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon, LocalizedNumberPipe],
  selector: 'app-review-dialog',
  styleUrl: './review-dialog.css',
  templateUrl: './review-dialog.html',
})
export class ReviewDialog {
  /** The translated description of the service request and its technician. */
  readonly requestLabel = input.required<string>();
  /** Whether the review is being submitted. */
  readonly pending = input(false);
  readonly submitted = output<ReviewSubmission>();
  readonly closed = output<void>();

  protected readonly criteria = CRITERIA;
  protected readonly scores = SCORES;
  protected readonly commentMaxLength = COMMENT_MAX_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    communication: [0, Validators.min(1)],
    efficacy: [0, Validators.min(1)],
    performance: [0, Validators.min(1)],
    comment: ['', Validators.maxLength(COMMENT_MAX_LENGTH)],
  });
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** The average of the scores given so far, or null until every criterion is scored. */
  protected readonly average = computed(() => {
    const value = this.value();
    const scores = CRITERIA.map((criterion) => value[criterion] ?? 0);
    return scores.every((score) => score > 0)
      ? scores.reduce((total, score) => total + score, 0) / scores.length
      : null;
  });

  protected score(criterion: RatingCriterion): number {
    return this.value()[criterion] ?? 0;
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { communication, efficacy, performance, comment } = this.form.getRawValue();
    this.submitted.emit({
      rating: { communication, efficacy, performance },
      comment: comment.trim(),
    });
  }

  protected showError(criterion: RatingCriterion): boolean {
    const control = this.form.controls[criterion];
    return control.touched && control.invalid;
  }
}
