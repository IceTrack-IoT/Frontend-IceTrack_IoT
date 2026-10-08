import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { environment } from '@env/environment';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';

const GSI_SCRIPT_SELECTOR = 'script[src^="https://accounts.google.com/gsi/client"]';
const GSI_LOAD_TIMEOUT_MS = 10_000;
const GSI_BUTTON_MIN_WIDTH = 200;
const GSI_BUTTON_MAX_WIDTH = 400;

/**
 * Presentation options of the rendered Google button.
 */
export interface GoogleButtonOptions {
  /** The language of the button text, e.g. `en` or `es`. Google picks one when omitted. */
  readonly locale?: string;
  /** The preferred width in pixels, clamped to the range supported by Google. */
  readonly width?: number;
}

/*
 * Minimal Google Identity Services members used by IAM.
 * Reference: https://developers.google.com/identity/gsi/web/reference/js-reference
 */
interface GoogleCredentialResponse {
  /** The Google ID token (JWT) issued to the user. */
  readonly credential: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonConfiguration {
  readonly type?: 'standard' | 'icon';
  readonly theme?: 'outline' | 'filled_blue' | 'filled_black';
  readonly size?: 'large' | 'medium' | 'small';
  readonly text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  readonly shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  readonly width?: number;
  readonly locale?: string;
}

interface GoogleAccountsId {
  initialize(configuration: GoogleIdConfiguration): void;
  renderButton(parent: HTMLElement, options: GoogleButtonConfiguration): void;
}

/**
 * Service for interacting with Google Identity Services (GSI) in an Angular application.
 * This service provides methods to render the Google Sign-In button and handle user credentials.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleIdentityServices {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly credentialsSubject = new Subject<GoogleCredential>();

  private accountsId: Promise<GoogleAccountsId> | null = null;

  readonly credentials: Observable<GoogleCredential> = this.credentialsSubject.asObservable();

  /**
   * Renders the Google Sign-In button inside the specified container element.
   * This method initializes the Google Identity Services and replaces the content of the container with the button.
   *
   * @param container The HTML element where the Google Sign-In button will be rendered. Must be connected to the document.
   * @param options The language and width of the button.
   * @returns A promise that resolves when the button is successfully rendered.
   * @throws Error if the container is not connected to the document or if Google Identity Services cannot be loaded.
   */
  async renderButton(container: HTMLElement, options: GoogleButtonOptions = {}): Promise<void> {
    this.assertBrowser();

    if (!container || !container.isConnected) {
      throw new Error('The Google button container is not connected to the document.');
    }

    const accountsId = await this.initialize();

    container.replaceChildren();

    accountsId.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      ...(options.locale ? { locale: options.locale } : {}),
      ...(options.width ? { width: clampButtonWidth(options.width) } : {}),
    });
  }

  /**
   * Initializes the Google Identity Services by loading the SDK and setting up the callback for credential responses.
   * This method ensures that the SDK is loaded only once and handles any errors that may occur during initialization.
   *
   * @returns A promise that resolves with the GoogleAccountsId instance when initialization is complete.
   * @private
   */
  private initialize(): Promise<GoogleAccountsId> {
    this.accountsId ??= this.loadAccountsId()
      .then((accountsId) => {
        accountsId.initialize({
          client_id: environment.googleClientId,
          callback: (response) => {
            if (!isGoogleCredentialResponse(response)) {
              return;
            }

            this.credentialsSubject.next({
              idToken: response.credential,
            });
          },
        });

        return accountsId;
      })
      .catch((error: unknown) => {
        this.accountsId = null;
        throw error;
      });

    return this.accountsId;
  }

  /**
   * Loads the Google Identity Services SDK and retrieves the GoogleAccountsId instance.
   * This method checks if the SDK is already loaded and handles any errors that may occur during loading.
   *
   * @returns A promise that resolves with the GoogleAccountsId instance when the SDK is successfully loaded.
   * @private
   */
  private loadAccountsId(): Promise<GoogleAccountsId> {
    this.assertBrowser();

    const clientId = environment.googleClientId.trim();

    if (!clientId) {
      return Promise.reject(
        new Error('Google sign-in is not configured: set googleClientId in the environment.'),
      );
    }

    const loaded = this.readAccountsId();

    if (loaded !== null) {
      return Promise.resolve(loaded);
    }

    const script = this.document.querySelector<HTMLScriptElement>(GSI_SCRIPT_SELECTOR);

    if (script === null) {
      return Promise.reject(
        new Error('The Google Identity Services script is missing from index.html.'),
      );
    }

    if (script.dataset['loaded'] === 'true') {
      return Promise.reject(
        new Error(
          'Google Identity Services script is marked as loaded, but the SDK is unavailable.',
        ),
      );
    }

    return new Promise<GoogleAccountsId>((resolve, reject) => {
      let settled = false;

      const cleanup = (): void => {
        clearTimeout(timer);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      };

      const resolveOnce = (accountsId: GoogleAccountsId): void => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        resolve(accountsId);
      };

      const rejectOnce = (error: Error): void => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        reject(error);
      };

      const onLoad = (): void => {
        script.dataset['loaded'] = 'true';

        const accountsId = this.readAccountsId();

        if (accountsId === null) {
          rejectOnce(
            new Error('Google Identity Services loaded, but google.accounts.id is unavailable.'),
          );
          return;
        }

        resolveOnce(accountsId);
      };

      const onError = (): void => {
        rejectOnce(new Error('Google Identity Services could not be loaded.'));
      };

      const timer = setTimeout(() => {
        rejectOnce(new Error('Google Identity Services load timed out.'));
      }, GSI_LOAD_TIMEOUT_MS);

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    });
  }

  /**
   * Reads the `google.accounts.id` object from the global window context.
   * This method safely accesses the nested properties and checks if the object conforms to the expected interface.
   *
   * @returns The GoogleAccountsId instance if available, or null if not found or invalid.
   * @private
   */
  private readAccountsId(): GoogleAccountsId | null {
    const google = readProperty(this.document.defaultView, 'google');

    const accounts = readProperty(google, 'accounts');
    const accountsId = readProperty(accounts, 'id');

    return isGoogleAccountsId(accountsId) ? accountsId : null;
  }

  /**
   * Asserts that the current platform is a browser environment.
   * This method throws an error if the code is executed in a non-browser context (e.g., server-side rendering).
   * @private
   */
  private assertBrowser(): void {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Google Identity Services is only available in the browser.');
    }
  }
}

function clampButtonWidth(width: number): number {
  return Math.min(GSI_BUTTON_MAX_WIDTH, Math.max(GSI_BUTTON_MIN_WIDTH, Math.floor(width)));
}

function readProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}

function isGoogleAccountsId(value: unknown): value is GoogleAccountsId {
  return (
    typeof readProperty(value, 'initialize') === 'function' &&
    typeof readProperty(value, 'renderButton') === 'function'
  );
}

function isGoogleCredentialResponse(value: unknown): value is GoogleCredentialResponse {
  const credential = readProperty(value, 'credential');

  return typeof credential === 'string' && credential.length > 0;
}
