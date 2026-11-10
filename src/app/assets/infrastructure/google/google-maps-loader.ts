import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';

import { environment } from '@env/environment';

const MAPS_SCRIPT_SELECTOR = 'script[data-google-maps]';
const MAPS_API_URL = 'https://maps.googleapis.com/maps/api/js';
const MAPS_LOAD_TIMEOUT_MS = 10_000;

/**
 * Loads the Google Maps JavaScript API that the native map components need. The API is requested once,
 * only in the browser, only when a map is rendered and only when the environment configures its key.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleMapsLoader {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private loading: Promise<void> | null = null;

  /** Whether the environment configures the API key the Google Maps JavaScript API requires. */
  readonly configured = environment.googleMapsApiKey.trim() !== '';

  /**
   * Loads the Google Maps JavaScript API, or resolves right away when it is already available. A failed
   * load is forgotten, so the next map rendered can try again.
   * @returns A promise that resolves when the API can be used.
   */
  load(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('Google Maps is only available in the browser.'));
    }

    const apiKey = environment.googleMapsApiKey.trim();

    if (apiKey === '') {
      return Promise.reject(
        new Error('Google Maps is not configured: set googleMapsApiKey in the environment.'),
      );
    }

    if (this.isLoaded()) {
      return Promise.resolve();
    }

    this.loading ??= this.loadScript(apiKey).catch((error: unknown) => {
      this.loading = null;
      throw error;
    });

    return this.loading;
  }

  /**
   * Loads one library of the Maps JavaScript API on demand.
   * @param library - The name of the library, such as `places`.
   * @returns A promise of the library namespace, as the API exposes it.
   */
  async importLibrary(library: string): Promise<unknown> {
    await this.load();

    const maps = readProperty(readProperty(this.document.defaultView, 'google'), 'maps');

    if (typeof maps !== 'object' || maps === null) {
      throw new Error('Google Maps cannot load libraries.');
    }

    const importLibrary = readProperty(maps, 'importLibrary');

    if (typeof importLibrary !== 'function') {
      throw new Error('Google Maps cannot load libraries.');
    }

    const loadLibrary = importLibrary as (name: string) => Promise<unknown>;

    return loadLibrary.call(maps, library);
  }

  /** Whether the Maps JavaScript API is already available in the window. */
  private isLoaded(): boolean {
    const maps = readProperty(readProperty(this.document.defaultView, 'google'), 'maps');

    return (
      typeof readProperty(maps, 'importLibrary') === 'function' ||
      typeof readProperty(maps, 'Map') === 'function'
    );
  }

  /** Appends the Maps JavaScript API script and settles when it loads, fails or times out. */
  private loadScript(apiKey: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const document = this.document;
      const script = document.createElement('script');
      let settled = false;

      const cleanup = (): void => {
        clearTimeout(timer);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      };

      const resolveOnce = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const rejectOnce = (error: Error): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        script.remove();
        reject(error);
      };

      const onLoad = (): void => {
        if (this.isLoaded()) {
          resolveOnce();
          return;
        }
        rejectOnce(new Error('Google Maps loaded, but google.maps is unavailable.'));
      };

      const onError = (): void => {
        rejectOnce(new Error('Google Maps could not be loaded.'));
      };

      const timer = setTimeout(() => {
        rejectOnce(new Error('Google Maps load timed out.'));
      }, MAPS_LOAD_TIMEOUT_MS);

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });

      script.src = `${MAPS_API_URL}?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
      script.async = true;
      script.dataset['googleMaps'] = 'true';

      document.querySelectorAll(MAPS_SCRIPT_SELECTOR).forEach((stale) => stale.remove());
      document.head.appendChild(script);
    });
  }
}

function readProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}
