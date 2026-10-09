import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MOCK_LATENCY_MS } from '@shared/presentation/mock/mock-data-source';
import { NotificationCenter } from './notification-center';

describe('NotificationCenter', () => {
  let fixture: ComponentFixture<NotificationCenter>;
  let element: HTMLElement;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };

  function items(): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('.notification-center__item'));
  }

  function buttonLabelled(item: HTMLElement, key: string): HTMLButtonElement | undefined {
    return Array.from(item.querySelectorAll('button')).find((button) =>
      button.textContent?.includes(key),
    );
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MOCK_LATENCY_MS, useValue: 0 },
      ],
    });
    fixture = TestBed.createComponent(NotificationCenter);
    element = fixture.nativeElement as HTMLElement;
  });

  it('shows a loading state, then the notifications with type, severity and read state', async () => {
    // Renders synchronously, before the mocked load resolves.
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')?.textContent).toContain(
      'notifications.center.loading',
    );

    await settle();

    const [first] = items();
    expect(first.textContent).toContain('notifications.types.OUT_OF_RANGER_TEMPERATURE');
    expect(first.textContent).toContain('notifications.severity.CRITICAL');
    expect(first.textContent).toContain('notifications.center.unread');
  });

  it('marks a notification as read', async () => {
    await settle();
    const unreadBefore = element.querySelectorAll('.notification-center__item--unread').length;

    buttonLabelled(items()[0], 'notifications.center.markAsRead')?.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('.notification-center__item--unread')).toHaveLength(
      unreadBefore - 1,
    );
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'notifications.center.markedAsRead',
    );
  });

  it('removes a dismissed notification from the active list', async () => {
    await settle();
    const message = items()[0].querySelector('.notification-center__message')?.textContent;

    buttonLabelled(items()[0], 'notifications.center.dismiss')?.click();
    await fixture.whenStable();

    expect(items().map((item) => item.textContent)).not.toContain(message);
  });

  it('marks every notification as read', async () => {
    await settle();

    const markAll = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('notifications.center.markAllAsRead'),
    );
    markAll?.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('.notification-center__item--unread')).toHaveLength(0);
    expect(markAll?.disabled).toBe(true);
  });
});
