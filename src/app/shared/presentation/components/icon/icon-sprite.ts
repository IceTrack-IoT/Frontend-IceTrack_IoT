import { HttpBackend, HttpClient } from '@angular/common/http';
import {
  DOCUMENT,
  type EnvironmentProviders,
  inject,
  Injectable,
  provideAppInitializer,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

const ICON_SPRITE_PATH = '/assets/icons/icons.svg';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
/** Prefixes the inlined symbol ids, so they never collide with element ids of the application. */
const INLINE_ID_PREFIX = 'app-icon-';

/**
 * Icon Sprite inlines the symbols of the icon sprite `public/assets/icons/icons.svg` in the document once,
 * so every icon references a symbol of the page itself. A `<use>` that references an external file makes
 * the browser request (or revalidate) that file again for every view rendering icons; an inlined symbol
 * costs no request at all.
 *
 * Until the sprite is inlined, or when it cannot be, icons reference the sprite file, as a fallback.
 */
@Injectable({
  providedIn: 'root',
})
export class IconSprite {
  private readonly document = inject(DOCUMENT);
  /** Bypasses the HTTP interceptors: the sprite is a static asset of the application, not an API call. */
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly inlined = signal(false);

  /**
   * Reads the sprite once and inlines its symbols in the document. It never fails: when the sprite cannot
   * be read, icons keep referencing the sprite file.
   * @returns A promise resolved once the sprite is inlined or given up.
   */
  inline(): Promise<void> {
    if (this.inlined()) {
      return Promise.resolve();
    }
    return firstValueFrom(this.http.get(ICON_SPRITE_PATH, { responseType: 'text' })).then(
      (markup) => this.insert(markup),
      () => undefined,
    );
  }

  /**
   * The reference of the symbol of an icon, for the `href` of a `<use>` element.
   * @param name - The symbol name in the sprite.
   * @returns The reference of the symbol, in the document or in the sprite file.
   */
  href(name: string): string {
    return this.inlined() ? `#${INLINE_ID_PREFIX}${name}` : `${ICON_SPRITE_PATH}#${name}`;
  }

  /** Copies only the `<symbol>` elements of the sprite into a hidden SVG at the start of the body. */
  private insert(markup: string): void {
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const symbols = Array.from(parsed.getElementsByTagNameNS(SVG_NAMESPACE, 'symbol'));
    if (symbols.length === 0) {
      return;
    }
    const container = this.document.createElementNS(SVG_NAMESPACE, 'svg');
    container.setAttribute('aria-hidden', 'true');
    container.setAttribute('focusable', 'false');
    container.setAttribute('width', '0');
    container.setAttribute('height', '0');
    container.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden');
    for (const symbol of symbols) {
      const copy = this.document.importNode(symbol, true);
      copy.id = `${INLINE_ID_PREFIX}${symbol.id}`;
      container.appendChild(copy);
    }
    this.document.body.prepend(container);
    this.inlined.set(true);
  }
}

/**
 * Inlines the icon sprite while the application starts, so the first view already renders its icons
 * without requesting the sprite file.
 * @returns The providers to add to the application configuration.
 */
export function provideIconSprite(): EnvironmentProviders {
  return provideAppInitializer(() => inject(IconSprite).inline());
}
