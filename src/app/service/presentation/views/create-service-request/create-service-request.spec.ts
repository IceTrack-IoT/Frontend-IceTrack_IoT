import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MOCK_LATENCY_MS } from '@shared/presentation/mock/mock-data-source';
import { CreateServiceRequest } from './create-service-request';

describe('CreateServiceRequest', () => {
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  };

  async function open(url: string): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'service-requests/new', component: CreateServiceRequest }]),
        provideTranslateService(),
        { provide: MOCK_LATENCY_MS, useValue: 0 },
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, CreateServiceRequest);
    element = harness.routeNativeElement as HTMLElement;
  }

  function field<T extends HTMLElement>(id: string): T {
    const control = element.querySelector<T>(`#${id}`);
    if (!control) {
      throw new Error(`Missing field ${id}`);
    }
    return control;
  }

  it('prefills a repair draft from an alert and asks the owner to confirm it', async () => {
    await open('/service-requests/new?equipmentId=1&type=REPAIR&alertId=1');

    expect(element.textContent).toContain('serviceRequests.form.fromAlert');
    expect(field<HTMLSelectElement>('request-type').value).toBe('REPAIR');
    expect(field<HTMLSelectElement>('request-equipment').selectedOptions[0].textContent).toContain(
      'Walk-In Freezer #02',
    );
    expect(element.querySelector('input[type="radio"]:checked')).toBeNull();
  });

  it('does not submit an incomplete request', async () => {
    await open('/service-requests/new');

    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();

    expect(field('request-equipment').getAttribute('aria-invalid')).toBe('true');
    expect(field('request-description-error').textContent).toContain('shared.validation.required');
    expect(element.querySelector('#request-confirmation-title')).toBeNull();
  });

  it('confirms the created request as pending', async () => {
    await open('/service-requests/new?equipmentId=4&type=REPAIR');
    Array.from(element.querySelectorAll('.create-request__priority'))
      .find((label) => label.textContent?.includes('serviceRequests.priority.HIGH'))
      ?.querySelector('input')
      ?.click();
    const description = field<HTMLTextAreaElement>('request-description');
    description.value = 'The chiller drifts above 4.5 °C in the afternoon.';
    description.dispatchEvent(new Event('input'));

    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();

    expect(element.querySelector('#request-confirmation-title')?.textContent).toContain(
      'serviceRequests.form.createdTitle',
    );
    expect(element.textContent).toContain('Display Chiller #05');
    expect(element.textContent).toContain('serviceRequests.status.PENDING');
  });
});
