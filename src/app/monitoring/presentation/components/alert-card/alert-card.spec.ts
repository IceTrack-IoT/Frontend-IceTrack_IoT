import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { AlertCard } from './alert-card';

function alert(severity: AlertSeverity, status: AlertStatus): Alert {
  return new Alert({
    id: 1,
    equipment_id: 1,
    type: AlertType.TEMPERATURE_EXCURSION,
    severity,
    status,
    trigger_reading_id: 70_001,
    peak_temperature: -11.9,
    excursion_duration: 15,
    opened_at: new Date(Date.now() - 14 * 60_000),
    resolved_at: status === AlertStatus.OPEN ? null : new Date(),
  });
}

describe('AlertCard', () => {
  let fixture: ComponentFixture<AlertCard>;
  let element: HTMLElement;

  async function render(item: Alert, acknowledgedAt: Date | null = null): Promise<void> {
    fixture.componentRef.setInput('alert', item);
    fixture.componentRef.setInput('acknowledgedAt', acknowledgedAt);
    await fixture.whenStable();
  }

  function buttons(): string[] {
    return Array.from(element.querySelectorAll('button, a.ui-button'), (button) =>
      (button.textContent ?? '').trim(),
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    fixture = TestBed.createComponent(AlertCard);
    element = fixture.nativeElement as HTMLElement;
  });

  it('shows severity and status as text, not only as color', async () => {
    await render(alert(AlertSeverity.CRITICAL, AlertStatus.OPEN));

    const tags = element.querySelectorAll('.ui-tag');
    expect(tags[0].textContent).toContain('monitoring.severity.CRITICAL');
    expect(tags[1].textContent).toContain('monitoring.alertStatus.OPEN');
  });

  it('offers acknowledge, dismiss and a prefilled service request for an open critical alert', async () => {
    await render(alert(AlertSeverity.CRITICAL, AlertStatus.OPEN));

    expect(buttons()).toEqual([
      'monitoring.alerts.acknowledge',
      'monitoring.alerts.dismiss',
      'monitoring.alerts.requestService',
    ]);
    const request = element.querySelector('a[href^="/service-requests/new"]');
    expect(request?.getAttribute('href')).toBe(
      '/service-requests/new?equipmentId=1&type=REPAIR&alertId=1',
    );
  });

  it('does not offer a service request for a non-critical alert', async () => {
    await render(alert(AlertSeverity.WARNING, AlertStatus.OPEN));

    expect(buttons()).not.toContain('monitoring.alerts.requestService');
  });

  it('marks an acknowledged alert and no longer offers to acknowledge it', async () => {
    await render(alert(AlertSeverity.CRITICAL, AlertStatus.OPEN), new Date());

    expect(element.textContent).toContain('monitoring.alerts.acknowledged');
    expect(buttons()).not.toContain('monitoring.alerts.acknowledge');
  });

  it('offers no actions for a closed alert', async () => {
    await render(alert(AlertSeverity.CRITICAL, AlertStatus.DISMISSED));

    expect(buttons()).toEqual([]);
  });

  it('emits the alert the owner acknowledges or wants to dismiss', async () => {
    const item = alert(AlertSeverity.WARNING, AlertStatus.OPEN);
    const acknowledged: Alert[] = [];
    const dismissed: Alert[] = [];
    fixture.componentInstance.acknowledged.subscribe((value) => acknowledged.push(value));
    fixture.componentInstance.dismissRequested.subscribe((value) => dismissed.push(value));
    await render(item);

    const [acknowledge, dismiss] = Array.from(
      element.querySelectorAll<HTMLButtonElement>('button'),
    );
    acknowledge.click();
    dismiss.click();

    expect(acknowledged).toEqual([item]);
    expect(dismissed).toEqual([item]);
  });
});
