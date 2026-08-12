import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { fakeBackendInterceptor } from './core/api/fake-backend-interceptor';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

// Los pipes de formato (`date`, `number`, `currency`) usan el locale activo.
// Sin registrarlo, Angular solo conoce `en-US` y las fechas saldrían en inglés.
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([fakeBackendInterceptor])),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};