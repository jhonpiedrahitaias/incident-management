import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed, tick } from '@angular/core/testing';
import { fakeBackendInterceptor, DEMO_PASSWORD, resetFakeBackend, setFakeBackendLatency } from '../core/infrastructure/api/fake-backend-interceptor';
import { authTokenInterceptor } from '../core/infrastructure/http/auth-token-interceptor';
import { correlationIdInterceptor } from '../core/infrastructure/http/correlation-id-interceptor';
import { errorHandlingInterceptor } from '../core/infrastructure/http/error-handling-interceptor';
import { loadingInterceptor } from '../core/infrastructure/http/loading-interceptor';
import { AuthService } from '../core/infrastructure/services/auth-service';
import { IncidentStore } from '../core/infrastructure/state/incident-store';
import { IncidentApi } from '../core/infrastructure/api/incident-api';
import { INCIDENT_REPOSITORY, USER_REPOSITORY, AUTH_GATEWAY, CREATE_INCIDENT, INCIDENT_CACHE, LIST_INCIDENTS, SESSION_STORE, UPDATE_INCIDENT_STATUS, CHANGE_INCIDENTS_STATUS, SESSION } from '../core/infrastructure/di/tokens';
import { UserService } from '../core/infrastructure/services/user-service';
import { CreateIncidentUseCase } from '../core/application/use-cases/create-incident.use-case';
import { ListIncidentsUseCase } from '../core/application/use-cases/list-incidents.use-case';
import { UpdateIncidentStatusUseCase } from '../core/application/use-cases/update-incident-status.use-case';
import { ChangeIncidentsStatusUseCase } from '../core/application/use-cases/change-incidents-status.use-case';
import { SessionStorageSessionStore } from '../core/infrastructure/services/session-storage-session-store';

/**
 * Utilidades para probar contra la API simulada.
 *
 * Las pruebas usan el mismo interceptor que la aplicación, así que
 * recorren el camino completo (servicio → `HttpClient` → interceptor) en
 * lugar de sustituir la capa HTTP por un doble.
 */

/**
 * Proveedores de HTTP con la **misma cadena de interceptores** que usa la
 * aplicación, para que las pruebas recorran el camino real: correlación,
 * contabilidad de carga y traducción de errores incluidas.
 */
export function provideTestApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        authTokenInterceptor,
        loadingInterceptor,
        errorHandlingInterceptor,
        fakeBackendInterceptor,
      ]),
    ),
    // Los puertos se cablean igual que en `app.config.ts`. Que haya que
    // repetirlo aquí no es una molestia: es la señal de que el puerto es
    // real. Las pruebas montan **otro inyector**, o sea otra raíz de
    // composición, y cada raíz elige sus adaptadores.
    //
    // Se usan los mismos que en producción a propósito: estas pruebas
    // recorren la cadena HTTP completa por diseño. Un repositorio en
    // memoria se conectaría exactamente igual, cambiando estas tres líneas.
    { provide: INCIDENT_REPOSITORY, useExisting: IncidentApi },
    { provide: USER_REPOSITORY, useExisting: UserService },
    { provide: AUTH_GATEWAY, useExisting: AuthService },
    { provide: SESSION_STORE, useExisting: SessionStorageSessionStore },
    { provide: SESSION, useExisting: AuthService },
    { provide: INCIDENT_CACHE, useExisting: IncidentStore },
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
      provide: CHANGE_INCIDENTS_STATUS,
      useFactory: () =>
        new ChangeIncidentsStatusUseCase(inject(UPDATE_INCIDENT_STATUS)),
    },
  ]);
}

/**
 * Credenciales válidas por rol.
 *
 * Corresponden a los usuarios simulados: Ana es ADMIN, Luis AGENT y Carlos
 * REQUESTER. Tenerlas por rol permite probar la autorización sin repetir
 * correos por los specs.
 */
export const CREDENTIALS_BY_ROLE = {
  ADMIN: { email: 'ana.torres@example.com', password: DEMO_PASSWORD },
  AGENT: { email: 'luis.gomez@example.com', password: DEMO_PASSWORD },
  REQUESTER: { email: 'carlos.pena@example.com', password: DEMO_PASSWORD },
} as const;

/** Credenciales por defecto (rol ADMIN). */
export const TEST_CREDENTIALS = CREDENTIALS_BY_ROLE.ADMIN;

/**
 * Inicia sesión y espera a la respuesta.
 * Solo se puede llamar dentro de `fakeAsync`.
 */
export function loginForTest(role: keyof typeof CREDENTIALS_BY_ROLE = 'ADMIN'): void {
  TestBed.inject(AuthService).login(CREDENTIALS_BY_ROLE[role]).subscribe();
  tick();
}

/**
 * Deja el backend en su estado inicial y sin latencia.
 * Debe llamarse **antes** de inyectar el servicio, porque este carga los
 * datos en su constructor.
 */
export function prepareApi(): void {
  resetFakeBackend();
  setFakeBackendLatency(0);
  // La sesión persiste en sessionStorage: sin esto, una prueba arrastraría
  // la sesión de la anterior.
  sessionStorage.clear();
}

/**
 * Inyecta el servicio y avanza el tiempo hasta que llega la carga inicial.
 * Solo se puede llamar dentro de `fakeAsync`.
 */
export function loadIncidents(): IncidentStore {
  const store = TestBed.inject(IncidentStore);
  store.clearError();

  TestBed.inject(LIST_INCIDENTS)
    .execute()
    .subscribe({
      error: (failure: Error) => {
        store.markLoaded();
        store.setError(failure.message);
      },
    });
  tick();

  return store;
}