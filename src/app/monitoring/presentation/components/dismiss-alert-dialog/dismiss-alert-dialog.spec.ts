import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { type AlertDismissal, DismissAlertDialog } from './dismiss-alert-dialog';

describe('DismissAlertDialog', () => {
  let fixture: ComponentFixture<DismissAlertDialog>;
  let element: HTMLElement;
  let dismissals: AlertDismissal[];

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
    fixture = TestBed.createComponent(DismissAlertDialog);
    fixture.componentRef.setInput('alertLabel', 'Temperature excursion · Walk-In Freezer #02');
    element = fixture.nativeElement as HTMLElement;
    dismissals = [];
    fixture.componentInstance.dismissed.subscribe((dismissal) => dismissals.push(dismissal));
    await fixture.whenStable();
  });

  async function submit(): Promise<void> {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('requires a reason and associates the error with the field', async () => {
    await submit();

    expect(dismissals).toEqual([]);
    const reason = element.querySelector('#dismiss-reason');
    expect(reason?.getAttribute('aria-invalid')).toBe('true');
    expect(reason?.getAttribute('aria-describedby')).toBe('dismiss-reason-error');
  });

  it('emits the reason and the trimmed notes', async () => {
    const reason = element.querySelector<HTMLSelectElement>('#dismiss-reason');
    const notes = element.querySelector<HTMLTextAreaElement>('#dismiss-notes');
    if (!reason || !notes) {
      throw new Error('Missing fields');
    }
    reason.value = 'DEFROST_CYCLE';
    reason.dispatchEvent(new Event('change'));
    notes.value = '  Scheduled defrost at 14:30.  ';
    notes.dispatchEvent(new Event('input'));
    await submit();

    expect(dismissals).toEqual([{ reason: 'DEFROST_CYCLE', notes: 'Scheduled defrost at 14:30.' }]);
  });
});
