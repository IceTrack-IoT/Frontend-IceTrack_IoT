import { Component, computed, DOCUMENT, effect, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

/**
 * Switches the interface between the supported languages. Each option is named in its own language, and
 * the page declares the active language so assistive technologies pronounce it correctly. It takes the
 * text color of its container, so it fits light and dark surfaces.
 *
 * The choice lasts for the current visit.
 * TODO: Persist it as the user's language preference once the Profiles store is available.
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-language-switcher',
  styleUrl: './language-switcher.css',
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcher {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  protected readonly languages = this.translate.getLangs();
  protected readonly current = computed(() => activeLanguage(this.translate));

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.current();
    });
  }

  protected select(language: string): void {
    if (language === this.current()) {
      return;
    }
    // When the translations cannot be loaded, the interface keeps its current language.
    this.translate.use(language).subscribe({ error: () => undefined });
  }
}
