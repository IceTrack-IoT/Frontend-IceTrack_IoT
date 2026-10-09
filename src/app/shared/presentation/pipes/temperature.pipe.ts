import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

/**
 * Formats a temperature in degrees Celsius in the active interface language, such as "-12.1°C" or
 * "-12,1 °C". Impure because the result depends on the active language as well as on the value.
 *
 * @example {{ equipment.last_known_temperature | temperature }}
 */
@Pipe({ name: 'temperature', pure: false })
export class TemperaturePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly formats = new Map<string, Intl.NumberFormat>();

  transform(value: number | null | undefined, fractionDigits = 1): string {
    if (value === null || value === undefined) {
      return '';
    }
    const language = activeLanguage(this.translate);
    const key = `${language}|${fractionDigits}`;
    let format = this.formats.get(key);
    if (!format) {
      format = new Intl.NumberFormat(language, {
        style: 'unit',
        unit: 'celsius',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
      this.formats.set(key, format);
    }
    return format.format(value);
  }
}
