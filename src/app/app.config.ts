import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';

import localeEs from '@angular/common/locales/es';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { fakeBackendInterceptor } from './core/infrastructure/api/fake-backend-interceptor';
import { authTokenInterceptor } from './core/infrastructure/http/auth-token-interceptor';
import { correlationIdInterceptor } from './core/infrastructure/http/correlation-id-interceptor';
import { errorHandlingInterceptor } from './core/infrastructure/http/error-handling-interceptor';
import { loadingInterceptor } from './core/infrastructure/http/loading-interceptor';
import { AUTH_GATEWAY, CHANGE_INCIDENTS_STATUS, CREATE_INCIDENT, INCIDENT_CACHE, INCIDENT_REPOSITORY, LIST_INCIDENTS, SESSION, SESSION_STORE, UPDATE_INCIDENT_STATUS, USER_REPOSITORY } from './core/infrastructure/di/tokens';
import { IncidentApi } from './core/infrastructure/api/incident-api';
import { AuthService } from './core/infrastructure/services/auth-service';
import { UserService } from './core/infrastructure/services/user-service';
import { CreateIncidentUseCase } from './core/application/use-cases/create-incident.use-case';
import { ListIncidentsUseCase } from './core/application/use-cases/list-incidents.use-case';
import { UpdateIncidentStatusUseCase } from './core/application/use-cases/update-incident-status.use-case';
import { SessionStorageSessionStore } from './core/infrastructure/services/session-storage-session-store';
import { IncidentStore } from './core/infrastructure/state/incident-store';
import { ChangeIncidentsStatusUseCase } from './core/application/use-cases/change-incidents-status.use-case';

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
    // --- Puertos y adaptadores ---------------------------------------------
    { provide: INCIDENT_REPOSITORY, useExisting: IncidentApi },
    { provide: USER_REPOSITORY, useExisting: UserService },
    { provide: AUTH_GATEWAY, useExisting: AuthService },
    { provide: SESSION_STORE, useExisting: SessionStorageSessionStore },
    { provide: SESSION, useExisting: AuthService },
    // El store es quien mantiene el modelo de lectura en memoria.
    { provide: INCIDENT_CACHE, useExisting: IncidentStore },

    // --- Casos de uso ------------------------------------------------------
    {
      provide: CREATE_INCIDENT,
      useFactory: () =>
        new CreateIncidentUseCase(inject(INCIDENT_REPOSITORY), inject(INCIDENT_CACHE)),
    },
    {
      provide: LIST_INCIDENTS,
      useFactory: () =>
        new ListIncidentsUseCase(inject(INCIDENT_REPOSITORY), inject(INCIDENT_CACHE)),
    },
    {
      provide: UPDATE_INCIDENT_STATUS,
      useFactory: () =>
        new UpdateIncidentStatusUseCase(inject(INCIDENT_REPOSITORY), inject(INCIDENT_CACHE)),
    },
       {
      // Se compone del anterior en vez de duplicar su lógica: las
      // transiciones válidas y la actualización del modelo de lectura ya
      // están resueltas allí.
      provide: CHANGE_INCIDENTS_STATUS,
      useFactory: () => new ChangeIncidentsStatusUseCase(inject(UPDATE_INCIDENT_STATUS)),
    },
  ],
};