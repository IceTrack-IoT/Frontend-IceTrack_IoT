import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Dialog } from './dialog';

@Component({
  imports: [Dialog],
  template: `
    <button id="opener" type="button" (click)="open.set(true)">Open</button>
    @if (open()) {
      <app-dialog heading="Dismiss alert" description="Walk-In Freezer #02" (closed)="closed()">
        <p>Body</p>
        <button dialogActions type="button">Confirm</button>
      </app-dialog>
    }
  `,
})
class DialogHost {
  readonly open = signal(false);
  readonly closed = vi.fn(() => this.open.set(false));
}

describe('Dialog', () => {
  let fixture: ComponentFixture<DialogHost>;
  let element: HTMLElement;

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
    fixture = TestBed.createComponent(DialogHost);
    element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    await fixture.whenStable();
  });

  afterEach(() => element.remove());

  async function openDialog(): Promise<HTMLDialogElement> {
    const opener = element.querySelector<HTMLButtonElement>('#opener');
    opener?.focus();
    opener?.click();
    await fixture.whenStable();
    const dialog = element.querySelector('dialog');
    if (!dialog) {
      throw new Error('The dialog was not rendered');
    }
    return dialog;
  }

  it('opens as a modal named by its heading and described by its description', async () => {
    const dialog = await openDialog();

    expect(dialog.open).toBe(true);
    const heading = element.querySelector(`#${dialog.getAttribute('aria-labelledby')}`);
    expect(heading?.textContent).toContain('Dismiss alert');
    const description = element.querySelector(`#${dialog.getAttribute('aria-describedby')}`);
    expect(description?.textContent).toContain('Walk-In Freezer #02');
    expect(dialog.querySelector('.dialog__footer button')?.textContent).toContain('Confirm');
  });

  it('asks the parent to close on Escape instead of closing by itself', async () => {
    const dialog = await openDialog();
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.closed).toHaveBeenCalledTimes(1);
  });

  it('closes with its labelled close button and returns the focus to the opener', async () => {
    const dialog = await openDialog();
    const close = dialog.querySelector<HTMLButtonElement>(
      'button[aria-label="shared.actions.close"]',
    );

    close?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.closed).toHaveBeenCalledTimes(1);
    expect(element.querySelector('dialog')).toBeNull();
    expect(document.activeElement?.id).toBe('opener');
  });
});
