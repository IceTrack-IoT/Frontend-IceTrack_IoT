import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MOCK_LATENCY_MS } from '@shared/presentation/mock/mock-data-source';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let element: HTMLElement;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };

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
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MOCK_LATENCY_MS, useValue: 0 },
      ],
    });
    fixture = TestBed.createComponent(Dashboard);
    element = fixture.nativeElement as HTMLElement;
    await settle();
  });

  function cardTitles(): string[] {
    return Array.from(element.querySelectorAll('.dashboard__grid h2'), (heading) =>
      (heading.textContent ?? '').trim(),
    );
  }

  function headline(selector: string): string | undefined {
    return element.querySelector(`${selector} .dashboard-card__value`)?.textContent?.trim();
  }

  function selectScope(value: string): void {
    const select = element.querySelector<HTMLSelectElement>('#dashboard-scope');
    if (select) {
      select.value = value;
      select.dispatchEvent(new Event('change'));
    }
  }

  function buttonWith(key: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes(key),
    );
  }

  it('shows only the visible cards, in their configured order', () => {
    expect(cardTitles()).toEqual([
      'profiles.cardType.MONITORED_EQUIPMENT',
      'profiles.cardType.OPEN_ALERTS',
      'profiles.cardType.EQUIPMENT_STATUS',
    ]);
  });

  it('opens on the default site and lets the owner widen the scope', async () => {
    expect(element.querySelector('.ui-page-header__subtitle')?.textContent).toContain(
      'profiles.dashboard.subtitleSite',
    );
    expect(headline('app-monitored-equipment-card')).toBe('3');
    expect(headline('app-open-alerts-card')).toBe('1');

    selectScope(element.querySelector('#dashboard-scope option')?.getAttribute('value') ?? '');
    await fixture.whenStable();

    expect(element.querySelector('.ui-page-header__subtitle')?.textContent).toContain(
      'profiles.dashboard.subtitleAll',
    );
    expect(headline('app-monitored-equipment-card')).toBe('10');
    expect(headline('app-open-alerts-card')).toBe('3');
  });

  it('applies the layout saved in the customize dialog', async () => {
    buttonWith('profiles.dashboard.customizeLayout')?.click();
    await fixture.whenStable();
    element.querySelector<HTMLInputElement>('#customize-card-13-visible')?.click();
    element.querySelector<HTMLButtonElement>('#customize-card-11-down')?.click();
    await fixture.whenStable();

    element.querySelector('#dashboard-customize-form')?.dispatchEvent(new Event('submit'));
    await settle();

    expect(element.querySelector('app-dashboard-customize-dialog')).toBeNull();
    expect(cardTitles()).toEqual([
      'profiles.cardType.OPEN_ALERTS',
      'profiles.cardType.MONITORED_EQUIPMENT',
      'profiles.cardType.ACTIVE_ORDERS',
      'profiles.cardType.EQUIPMENT_STATUS',
    ]);
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'profiles.dashboard.saved',
    );
  });

  it('explains how to bring cards back when every card is hidden', async () => {
    buttonWith('profiles.dashboard.customizeLayout')?.click();
    await fixture.whenStable();
    for (const id of [11, 12, 14]) {
      element.querySelector<HTMLInputElement>(`#customize-card-${id}-visible`)?.click();
    }
    await fixture.whenStable();
    element.querySelector('#dashboard-customize-form')?.dispatchEvent(new Event('submit'));
    await settle();

    expect(cardTitles()).toEqual([]);
    expect(element.textContent).toContain('profiles.dashboard.noCardsTitle');
  });
});
