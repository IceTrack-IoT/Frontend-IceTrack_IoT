import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CancelRequestDialog } from './cancel-request-dialog';

describe('CancelRequestDialog', () => {
  let fixture: ComponentFixture<CancelRequestDialog>;
  let element: HTMLElement;
  let reasons: string[];

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
    fixture = TestBed.createComponent(CancelRequestDialog);
    fixture.componentRef.setInput('requestLabel', 'Request #9 · Walk-In Freezer #02');
    element = fixture.nativeElement as HTMLElement;
    reasons = [];
    fixture.componentInstance.canceled.subscribe((reason) => reasons.push(reason));
    await fixture.whenStable();
  });

  async function confirmWith(reason: string): Promise<void> {
    const field = element.querySelector<HTMLTextAreaElement>('#cancel-reason');
    if (!field) {
      throw new Error('Missing reason field');
    }
    field.value = reason;
    field.dispatchEvent(new Event('input'));
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('warns that the cancellation cannot be undone', () => {
    expect(element.textContent).toContain('serviceRequests.cancel.warning');
  });

  it('requires a reason before canceling', async () => {
    await confirmWith('');

    expect(reasons).toEqual([]);
    expect(element.querySelector('#cancel-reason-error')?.textContent).toContain(
      'serviceRequests.cancel.reasonRequired',
    );
    expect(element.querySelector('#cancel-reason')?.getAttribute('aria-describedby')).toContain(
      'cancel-reason-error',
    );
  });

  it('rejects a reason that is too short', async () => {
    await confirmWith('Too soon');

    expect(reasons).toEqual([]);
    expect(element.querySelector('#cancel-reason-error')?.textContent).toContain(
      'serviceRequests.cancel.reasonTooShort',
    );
  });

  it('emits the trimmed reason', async () => {
    await confirmWith('  The equipment was replaced by the landlord.  ');

    expect(reasons).toEqual(['The equipment was replaced by the landlord.']);
  });
});
