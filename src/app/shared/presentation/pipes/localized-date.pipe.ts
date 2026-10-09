import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

/** The presentations of a date: the date, the time of day, or both. */
export type DateDisplay = 'date' | 'time' | 'dateTime';

const DATE_DISPLAY_OPTIONS: Readonly<Record<DateDisplay, Intl.DateTimeFormatOptions>> = {
  date: { dateStyle: 'medium' },
  time: { timeStyle: 'short' },
  dateTime: { dateStyle: 'medium', timeStyle: 'short' },
};

/**
 * Formats a date in the active interface language, so dates follow the conventions of English or Spanish.
 * Impure because the result depends on the active language as well as on the date.
 *
 * @example {{ alert.opened_at | localizedDate: 'dateTime' }}
 */
@Pipe({ name: 'localizedDate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly formats = new Map<string, Intl.DateTimeFormat>();

  transform(value: Date | null | undefined, display: DateDisplay = 'dateTime'): string {
    if (!value) {
      return '';
    }
    const language = activeLanguage(this.translate);
    const key = `${language}|${display}`;
    let format = this.formats.get(key);
    if (!format) {
      format = new Intl.DateTimeFormat(language, DATE_DISPLAY_OPTIONS[display]);
      this.formats.set(key, format);
    }
    return format.format(value);
  }
}
