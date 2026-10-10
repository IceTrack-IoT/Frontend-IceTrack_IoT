import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Settings } from './settings';

@Component({ selector: 'app-settings-section', template: '<h2>Owner profile</h2>' })
class SettingsSection {}

describe('Settings', () => {
  it('renders the sections of its routes under a single page heading', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideRouter([
          {
            path: 'settings',
            component: Settings,
            children: [{ path: '', component: SettingsSection }],
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/settings');

    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('shared.settings.title');
    expect(element.querySelector('app-settings-section h2')?.textContent).toBe('Owner profile');
  });
});
