import { Component, computed, inject, input, type OnInit, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  MAX_REVIEW_SCORE,
  MIN_REVIEW_SCORE,
  type ReviewRating,
} from '@service/domain/value-objects/review-rating';
import { REVIEW_COMMENT_MAX_LENGTH } from '@service/application/contracts/new-service-request';
import type { ReviewScores } from '@service/application/contracts/review-scores';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

type RatingCriterion = keyof ReviewRating;

const CRITERIA: readonly RatingCriterion[] = ['communication', 'efficacy', 'performance'];
const SCORES = Array.from(
  { length: MAX_REVIEW_SCORE - MIN_REVIEW_SCORE + 1 },
  (_, index) => MIN_REVIEW_SCORE + index,
);

/**
 * Review of the technician who completed a service: a score from 1 to 5 for each criterion, chosen with
 * radio buttons, and an optional comment. In edit mode it starts from the current review and shows until
 * when the backend accepts edits.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Dialog,
    Icon,
    LocalizedDatePipe,
    LocalizedNumberPipe,
  ],
  selector: 'app-review-dialog',
  styleUrl: './review-dialog.css',
  templateUrl: './review-dialog.html',
})
export class ReviewDialog implements OnInit {
  /** The translated description of the service request and its technician. */
  readonly requestLabel = input.required<string>();
  /** The current review when editing it, or null to submit a new one. */
  readonly initial = input<ReviewScores | null>(null);
  /** Until when the backend accepts edits, shown in edit mode. */
  readonly editableUntil = input<Date | null>(null);
  /** Whether the review is being submitted. */
  readonly pending = input(false);
  /** The translation key of the last failure of the submission, if any. */
  readonly errorKey = input<string | null>(null);
  readonly submitted = output<ReviewScores>();
  readonly closed = output<void>();

  protected readonly criteria = CRITERIA;
  protected readonly scores = SCORES;
  protected readonly commentMaxLength = REVIEW_COMMENT_MAX_LENGTH;
  protected readonly editing = computed(() => this.initial() !== null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    communication: [0, Validators.min(MIN_REVIEW_SCORE)],
    efficacy: [0, Validators.min(MIN_REVIEW_SCORE)],
    performance: [0, Validators.min(MIN_REVIEW_SCORE)],
    comment: ['', Validators.maxLength(REVIEW_COMMENT_MAX_LENGTH)],
  });
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /**
   * The average of the scores given so far, or null until every criterion is scored. It is a preview;
   * the backend computes the stored average.
   */
  protected readonly average = computed(() => {
    const value = this.value();
    const scores = CRITERIA.map((criterion) => value[criterion] ?? 0);
    return scores.every((score) => score >= MIN_REVIEW_SCORE)
      ? scores.reduce((total, score) => total + score, 0) / scores.length
      : null;
  });

  ngOnInit(): void {
    const initial = this.initial();
    if (initial !== null) {
      this.form.setValue({ ...initial.rating, comment: initial.comment ?? '' });
    }
  }

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
