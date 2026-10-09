import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MOCK_LATENCY_MS } from '@shared/presentation/mock/mock-data-source';
import { GenerateReport } from './generate-report';

describe('GenerateReport', () => {
  let fixture: ComponentFixture<GenerateReport>;
  let element: HTMLElement;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };

  function set(id: string, value: string, event = 'input'): void {
    const control = element.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
    if (!control) {
      throw new Error(`Missing field ${id}`);
    }
    control.value = value;
    control.dispatchEvent(new Event(event));
    control.dispatchEvent(new Event('blur'));
  }

  async function submit(): Promise<void> {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: MOCK_LATENCY_MS, useValue: 0 },
      ],
    });
    fixture = TestBed.createComponent(GenerateReport);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  function fillValidReport(): void {
    set('report-title', 'Cold-chain compliance · October 2026');
    set('report-type', 'TEMPERATURE_EXCURSION', 'change');
    set('report-from', '2026-10-01');
    set('report-to', '2026-10-08');
  }

  it('rejects a period whose start is after its end', async () => {
    fillValidReport();
    set('report-from', '2026-10-09');
    await submit();

    expect(element.querySelector('#report-to-error')?.textContent).toContain(
      'reporting.validation.invalidRange',
    );
    expect(element.querySelector('#report-confirmation-title')).toBeNull();
  });

  it('requests the report and shows it as pending', async () => {
    fillValidReport();
    await submit();

    expect(element.querySelector('#report-confirmation-title')?.textContent).toContain(
      'reporting.form.requestedTitle',
    );
    expect(element.textContent).toContain('reporting.status.PENDING');
    expect(element.textContent).toContain('Cold-chain compliance · October 2026');
  });
});
