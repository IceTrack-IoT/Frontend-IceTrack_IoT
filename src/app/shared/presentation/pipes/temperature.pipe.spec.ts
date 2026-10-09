import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { TemperaturePipe } from './temperature.pipe';

describe('TemperaturePipe', () => {
  let pipe: TemperaturePipe;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService(), TemperaturePipe] });
    pipe = TestBed.inject(TemperaturePipe);
    translate = TestBed.inject(TranslateService);
  });

  it('formats degrees Celsius with one decimal in English by default', () => {
    expect(pipe.transform(-12.14)).toMatch(/^[-−]12\.1\s?°C$/);
  });

  it('follows the active language', async () => {
    translate.setTranslation('es', {});
    await firstValueFrom(translate.use('es'));

    expect(pipe.transform(4.7)).toMatch(/^4,7\s?°C$/);
  });

  it('renders nothing for a missing value', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
