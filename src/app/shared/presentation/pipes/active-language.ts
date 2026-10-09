import type { TranslateService } from '@ngx-translate/core';

/** The language used when no language is active yet; English is the fallback language. */
const DEFAULT_LANGUAGE = 'en';

/**
 * Returns the active interface language. It reads the reactive language of the translation service, so a
 * template that formats with it renders again when the language changes.
 * @param translate - The translation service.
 * @returns The active language code, such as `en` or `es`.
 */
export function activeLanguage(translate: TranslateService): string {
  return translate.currentLang() ?? translate.getFallbackLang() ?? DEFAULT_LANGUAGE;
}
