import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CardType } from '@profiles/domain/value-objects/card-type';
import {
  createDashboardConfigMock,
  DASHBOARD_SITES,
} from '@profiles/presentation/mocks/dashboard.mock';
import { DashboardCustomizeDialog, type DashboardLayoutChange } from './dashboard-customize-dialog';

describe('DashboardCustomizeDialog', () => {
  let fixture: ComponentFixture<DashboardCustomizeDialog>;
  let element: HTMLElement;
  let changes: DashboardLayoutChange[];

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
    fixture = TestBed.createComponent(DashboardCustomizeDialog);
    fixture.componentRef.setInput('config', createDashboardConfigMock());
    fixture.componentRef.setInput('sites', DASHBOARD_SITES);
    element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    changes = [];
    fixture.componentInstance.saved.subscribe((change) => changes.push(change));
    await fixture.whenStable();
  });

  afterEach(() => element.remove());

  function cardNames(): string[] {
    return Array.from(element.querySelectorAll('.customize__name'), (label) =>
      (label.textContent ?? '').trim(),
    );
  }

  function visibilitySwitch(cardId: number): HTMLInputElement {
    const input = element.querySelector<HTMLInputElement>(`#customize-card-${cardId}-visible`);
    if (!input) {
      throw new Error(`Missing switch of card ${cardId}`);
    }
    return input;
  }

  function button(id: string): HTMLButtonElement {
    const found = element.querySelector<HTMLButtonElement>(`#${id}`);
    if (!found) {
      throw new Error(`Missing button ${id}`);
    }
    return found;
  }

  async function save(): Promise<void> {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('lists the cards in their configured order with a labelled visibility switch each', () => {
    expect(cardNames()).toEqual([
      'profiles.cardType.MONITORED_EQUIPMENT',
      'profiles.cardType.OPEN_ALERTS',
      'profiles.cardType.ACTIVE_ORDERS',
      'profiles.cardType.EQUIPMENT_STATUS',
    ]);
    expect(visibilitySwitch(13).getAttribute('role')).toBe('switch');
    expect(visibilitySwitch(13).checked).toBe(false);
    expect(visibilitySwitch(11).checked).toBe(true);
    expect(button('customize-card-11-up').disabled).toBe(true);
    expect(button('customize-card-14-down').disabled).toBe(true);
  });

  it('moves a card, announces its new position and keeps the focus on it', async () => {
    button('customize-card-11-down').focus();
    button('customize-card-11-down').click();
    await fixture.whenStable();

    expect(cardNames()[1]).toBe('profiles.cardType.MONITORED_EQUIPMENT');
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'profiles.dashboard.customize.moved',
    );
    expect(document.activeElement?.id).toBe('customize-card-11-down');
  });

  it('moves the focus to the other button when a card reaches the end of the list', async () => {
    button('customize-card-12-up').click();
    await fixture.whenStable();

    expect(cardNames()[0]).toBe('profiles.cardType.OPEN_ALERTS');
    expect(document.activeElement?.id).toBe('customize-card-12-down');
  });

  it('saves the new order, visibility and defaults', async () => {
    button('customize-card-14-up').click();
    visibilitySwitch(13).click();
    await fixture.whenStable();
    await save();

    expect(changes).toHaveLength(1);
    const [change] = changes;
    expect(change.cards.map((card) => [card.card_type, card.order, card.is_visible])).toEqual([
      [CardType.MONITORED_EQUIPMENT, 1, true],
      [CardType.OPEN_ALERTS, 2, true],
      [CardType.EQUIPMENT_STATUS, 3, true],
      [CardType.ACTIVE_ORDERS, 4, true],
    ]);
    expect(change.defaultSiteId).toBe(1);
    expect(change.defaultTemperatureRange).toEqual({
      min: -20,
      max: -16,
      unit: '°C',
      label: 'Frozen goods',
    });
  });

  it('does not save a reference range whose minimum is not lower than its maximum', async () => {
    const min = element.querySelector<HTMLInputElement>('#customize-min');
    if (min) {
      min.value = '-16';
      min.dispatchEvent(new Event('input'));
      min.dispatchEvent(new Event('blur'));
    }
    await save();

    expect(changes).toEqual([]);
    expect(element.querySelector('#customize-range-error')?.textContent).toContain(
      'profiles.dashboard.customize.minBelowMax',
    );
    expect(min?.getAttribute('aria-invalid')).toBe('true');
  });

  it('restores the default layout with every card visible', async () => {
    button('customize-card-14-up').click();
    await fixture.whenStable();

    Array.from(element.querySelectorAll<HTMLButtonElement>('button'))
      .find((candidate) => candidate.textContent?.includes('profiles.dashboard.customize.restore'))
      ?.click();
    await fixture.whenStable();

    expect(cardNames()).toEqual([
      'profiles.cardType.MONITORED_EQUIPMENT',
      'profiles.cardType.OPEN_ALERTS',
      'profiles.cardType.ACTIVE_ORDERS',
      'profiles.cardType.EQUIPMENT_STATUS',
    ]);
    expect(visibilitySwitch(13).checked).toBe(true);
  });
});
