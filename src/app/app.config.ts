import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { AuthenticationPort } from '@iam/application/ports/authentication.port';
import { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import { IamApi } from '@iam/infrastructure/api/iam-api';
import { BrowserClientSessionStorage } from '@iam/infrastructure/storage/browser-client-session-storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    { provide: AuthenticationPort, useExisting: IamApi },
    { provide: SessionStoragePort, useExisting: BrowserClientSessionStorage },
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      translate.addLangs(['en', 'es']);

      const browserLang = translate.getBrowserLang();
      const selectedLang = browserLang && ['en', 'es'].includes(browserLang) ? browserLang : 'en';
      return firstValueFrom(translate.use(selectedLang));
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
