import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import { EquipmentThresholdForm } from './equipment-threshold-form';

describe('EquipmentThresholdForm', () => {
  let fixture: ComponentFixture<EquipmentThresholdForm>;
  let element: HTMLElement;
  let saved: TemperatureThreshold[];

  function input(id: string): HTMLInputElement {
    const field = element.querySelector<HTMLInputElement>(`#${id}`);
    if (!field) {
      throw new Error(`Missing input ${id}`);
    }
    return field;
  }

  function typeInto(id: string, value: string): void {
    const field = input(id);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
  }

  async function submit(): Promise<void> {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(EquipmentThresholdForm);
    fixture.componentRef.setInput('threshold', { min_celsius: -20, max_celsius: -16 });
    element = fixture.nativeElement as HTMLElement;
    saved = [];
    fixture.componentInstance.saved.subscribe((threshold) => saved.push(threshold));
    await fixture.whenStable();
  });

  it('starts from the current threshold, labelled in degrees Celsius', () => {
    expect(input('threshold-minCelsius').value).toBe('-20');
    expect(input('threshold-maxCelsius').value).toBe('-16');
    expect(element.querySelector('label[for="threshold-minCelsius"]')?.textContent).toContain(
      'assets.thresholdForm.min',
    );
  });

  it('rejects a minimum that is not lower than the maximum and explains why', async () => {
    typeInto('threshold-minCelsius', '-16');
    await submit();

    expect(saved).toEqual([]);
    expect(element.querySelector('#threshold-range-error')?.textContent).toContain(
      'assets.thresholdForm.minBelowMax',
    );
    expect(input('threshold-minCelsius').getAttribute('aria-invalid')).toBe('true');
    expect(input('threshold-maxCelsius').getAttribute('aria-describedby')).toContain(
      'threshold-range-error',
    );
  });

  it('requires both limits', async () => {
    typeInto('threshold-maxCelsius', '');
    await submit();

    expect(saved).toEqual([]);
    expect(element.querySelector('#threshold-maxCelsius-error')?.textContent).toContain(
      'shared.validation.required',
    );
  });

  it('emits a valid threshold', async () => {
    typeInto('threshold-minCelsius', '-22.5');
    typeInto('threshold-maxCelsius', '-17');
    await submit();

    expect(saved).toEqual([{ min_celsius: -22.5, max_celsius: -17 }]);
  });

  it('disables saving while the save is pending', async () => {
    fixture.componentRef.setInput('pending', true);
    await fixture.whenStable();

    const button = element.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toContain('shared.actions.saving');
  });
});
