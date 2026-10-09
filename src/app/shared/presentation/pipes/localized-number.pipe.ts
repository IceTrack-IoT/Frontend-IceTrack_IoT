import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

/**
 * Formats a number with a fixed number of decimals in the active interface language, such as "1,234.5"
 * or "1234,5". Impure because the result depends on the active language as well as on the value.
 *
 * @example {{ kpi.value | localizedNumber: 1 }}
 */
@Pipe({ name: 'localizedNumber', pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly formats = new Map<string, Intl.NumberFormat>();

  transform(value: number | null | undefined, fractionDigits = 0): string {
    if (value === null || value === undefined) {
      return '';
    }
    const language = activeLanguage(this.translate);
    const key = `${language}|${fractionDigits}`;
    let format = this.formats.get(key);
    if (!format) {
      format = new Intl.NumberFormat(language, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
      this.formats.set(key, format);
    }
    return format.format(value);
  }
}
