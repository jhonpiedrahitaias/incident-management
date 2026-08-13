import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';

import localeEs from '@angular/common/locales/es';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { fakeBackendInterceptor } from './core/api/fake-backend-interceptor';
import { authTokenInterceptor } from './core/http/auth-token-interceptor';
import { correlationIdInterceptor } from './core/http/correlation-id-interceptor';
import { errorHandlingInterceptor } from './core/http/error-handling-interceptor';
import { loadingInterceptor } from './core/http/loading-interceptor';

// Los pipes de formato (`date`, `number`, `currency`) usan el locale activo.
// Sin registrarlo, Angular solo conoce `en-US` y las fechas saldrían en inglés.
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        authTokenInterceptor,
        loadingInterceptor,
        errorHandlingInterceptor,
        fakeBackendInterceptor,
      ]),
    ),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};