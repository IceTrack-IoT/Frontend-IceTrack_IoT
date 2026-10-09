import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ReviewDialog, type ReviewSubmission } from './review-dialog';

describe('ReviewDialog', () => {
  let fixture: ComponentFixture<ReviewDialog>;
  let element: HTMLElement;
  let submissions: ReviewSubmission[];

  beforeAll(() => {
    // jsdom does not implement the modal dialog API.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(ReviewDialog);
    fixture.componentRef.setInput('requestLabel', 'Request #4 · Carlos Mendoza');
    element = fixture.nativeElement as HTMLElement;
    submissions = [];
    fixture.componentInstance.submitted.subscribe((submission) => submissions.push(submission));
    await fixture.whenStable();
  });

  function score(criterion: string, value: number): void {
    const radios = element.querySelectorAll<HTMLInputElement>(
      `fieldset[aria-describedby^="review-${criterion}"] input[type="radio"]`,
    );
    radios[value - 1].click();
  }

  async function submit(): Promise<void> {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('offers each criterion as a group of five labelled radio buttons', () => {
    const groups = element.querySelectorAll('fieldset');
    expect(groups).toHaveLength(3);
    expect(groups[0].querySelector('legend')?.textContent).toContain(
      'serviceRequests.review.criteria.communication',
    );
    expect(groups[0].querySelectorAll('input[type="radio"]')).toHaveLength(5);
  });

  it('requires a score for every criterion', async () => {
    score('communication', 5);
    await submit();

    expect(submissions).toEqual([]);
    expect(element.querySelector('#review-efficacy-error')?.textContent).toContain(
      'serviceRequests.review.scoreRequired',
    );
  });

  it('emits the scores and the comment', async () => {
    score('communication', 5);
    score('efficacy', 4);
    score('performance', 3);
    const comment = element.querySelector<HTMLTextAreaElement>('#review-comment');
    if (comment) {
      comment.value = 'Fixed it on the first visit.';
      comment.dispatchEvent(new Event('input'));
    }
    await submit();

    expect(submissions).toEqual([
      {
        rating: { communication: 5, efficacy: 4, performance: 3 },
        comment: 'Fixed it on the first visit.',
      },
    ]);
    expect(element.querySelector('.review-dialog__average')?.textContent).toContain(
      'serviceRequests.review.average',
    );
  });
});
