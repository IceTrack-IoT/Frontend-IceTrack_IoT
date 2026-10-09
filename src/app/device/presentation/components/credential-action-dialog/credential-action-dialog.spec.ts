import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { type CredentialAction, CredentialActionDialog } from './credential-action-dialog';

describe('CredentialActionDialog', () => {
  let fixture: ComponentFixture<CredentialActionDialog>;
  let element: HTMLElement;
  let confirmed: number;

  beforeAll(() => {
    // jsdom does not implement the modal dialog API.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  async function render(action: CredentialAction): Promise<void> {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(CredentialActionDialog);
    fixture.componentRef.setInput('action', action);
    fixture.componentRef.setInput('deviceLabel', 'Device #4401 · Walk-In Freezer #02');
    element = fixture.nativeElement as HTMLElement;
    confirmed = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);
    await fixture.whenStable();
  }

  function footerButton(index: number): HTMLButtonElement {
    return element.querySelectorAll<HTMLButtonElement>('.dialog__footer button')[index];
  }

  it('requires acknowledging the consequence before revoking a credential', async () => {
    await render('revoke');

    footerButton(1).click();
    await fixture.whenStable();

    expect(confirmed).toBe(0);
    expect(element.querySelector('#revoke-acknowledgement-error')?.textContent).toContain(
      'devices.credential.revoke.acknowledgementRequired',
    );

    element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    footerButton(1).click();

    expect(confirmed).toBe(1);
  });

  it('confirms a rotation directly', async () => {
    await render('rotate');

    footerButton(1).click();

    expect(confirmed).toBe(1);
  });

  it('shows the issued key once and closes only after the owner confirms storing it', async () => {
    await render('rotate');
    fixture.componentRef.setInput('result', { issuedKey: 'itk_live_0123456789abcdef' });
    await fixture.whenStable();

    expect(element.querySelector<HTMLInputElement>('#issued-key')?.value).toBe(
      'itk_live_0123456789abcdef',
    );
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'devices.credential.storeNow',
    );
    expect(footerButton(0).disabled).toBe(true);

    element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    await fixture.whenStable();

    expect(footerButton(0).disabled).toBe(false);
  });
});
