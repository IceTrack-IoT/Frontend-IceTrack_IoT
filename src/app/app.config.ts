import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { authenticationInterceptor } from '@iam/infrastructure/http/authentication.interceptor';
import { provideIam } from '@iam/infrastructure/iam.providers';
import { provideProfiles } from '@profiles/infrastructure/profiles.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authenticationInterceptor])),
    provideIam(),
    provideProfiles(),
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
