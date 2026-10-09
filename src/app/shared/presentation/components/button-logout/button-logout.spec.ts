import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ButtonLogout } from './button-logout';

describe('ButtonLogout', () => {
  it('emits the intent to sign out from a labelled button', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(ButtonLogout);
    const signOut = vi.fn();
    fixture.componentInstance.signOut.subscribe(signOut);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.textContent).toContain('shared.actions.signOut');

    button?.click();

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
