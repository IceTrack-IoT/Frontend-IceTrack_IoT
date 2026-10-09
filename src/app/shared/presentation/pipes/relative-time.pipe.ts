import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/**
 * Formats how long ago a moment happened in the active interface language.
 *
 * @example {{ reading.recorded_at | relativeTime }}
 */
@Pipe({ name: 'relativeTime', pure: false })
export class RelativeTimePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly formats = new Map<string, Intl.RelativeTimeFormat>();

  transform(value: Date | null | undefined): string {
    if (!value) {
      return '';
    }
    const language = activeLanguage(this.translate);
    let format = this.formats.get(language);
    if (!format) {
      format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
      this.formats.set(language, format);
    }
    const elapsedSeconds = Math.round((value.getTime() - Date.now()) / 1000);
    for (const [unit, seconds] of RELATIVE_UNITS) {
      if (Math.abs(elapsedSeconds) >= seconds) {
        return format.format(Math.trunc(elapsedSeconds / seconds), unit);
      }
    }
    return format.format(elapsedSeconds, 'second');
  }
}
