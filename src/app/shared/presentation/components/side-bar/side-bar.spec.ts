import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SideBar } from './side-bar';

describe('SideBar', () => {
  let fixture: ComponentFixture<SideBar>;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'settings', children: [] }]), provideTranslateService()],
    });
    fixture = TestBed.createComponent(SideBar);
    fixture.componentRef.setInput('items', [
      { path: '/dashboard', labelKey: 'shared.navigation.dashboard', icon: 'gauge' },
    ]);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('shows the username of the signed-in account, linking to its settings', async () => {
    fixture.componentRef.setInput('account', { username: 'mrojas', settingsPath: '/settings' });
    await fixture.whenStable();

    const link = element.querySelector<HTMLAnchorElement>('a[href="/settings"]');
    expect(link?.textContent).toContain('mrojas');
    expect(link?.textContent).toContain('shared.navigation.settings');
    expect(link?.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('M');
  });

  it('shows no account while it is not known', () => {
    expect(element.querySelector('a[href="/settings"]')).toBeNull();
  });

  it('notifies when the account link is followed', async () => {
    fixture.componentRef.setInput('account', { username: 'mrojas', settingsPath: '/settings' });
    await fixture.whenStable();
    let navigated = 0;
    fixture.componentInstance.navigated.subscribe(() => navigated++);

    element.querySelector<HTMLAnchorElement>('a[href="/settings"]')?.click();
    await fixture.whenStable();

    expect(navigated).toBe(1);
  });
});
