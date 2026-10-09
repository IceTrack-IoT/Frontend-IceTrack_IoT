import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  let fixture: ComponentFixture<LanguageSwitcher>;
  let element: HTMLElement;

  function option(language: string): HTMLButtonElement {
    const button = element.querySelector<HTMLButtonElement>(`button[lang="${language}"]`);
    if (!button) {
      throw new Error(`Missing option ${language}`);
    }
    return button;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    TestBed.inject(TranslateService).addLangs(['en', 'es']);
    fixture = TestBed.createComponent(LanguageSwitcher);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('offers each supported language in a labelled group, named in its own language', () => {
    expect(element.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'shared.languageSwitcher.label',
    );
    expect(option('en').textContent).toContain('shared.languageSwitcher.languages.en');
    expect(option('es').textContent).toContain('shared.languageSwitcher.languages.es');
  });

  it('marks the active language as pressed', () => {
    expect(option('en').getAttribute('aria-pressed')).toBe('true');
    expect(option('es').getAttribute('aria-pressed')).toBe('false');
  });

  it('switches the interface and the page language', async () => {
    option('es').click();
    await fixture.whenStable();

    expect(TestBed.inject(TranslateService).getCurrentLang()).toBe('es');
    expect(option('es').getAttribute('aria-pressed')).toBe('true');
    expect(option('en').getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.lang).toBe('es');
  });
});
