import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed, tick } from '@angular/core/testing';
import { fakeBackendInterceptor, DEMO_PASSWORD, resetFakeBackend, setFakeBackendLatency } from '../core/api/fake-backend-interceptor';
import { authTokenInterceptor } from '../core/http/auth-token-interceptor';
import { correlationIdInterceptor } from '../core/http/correlation-id-interceptor';
import { errorHandlingInterceptor } from '../core/http/error-handling-interceptor';
import { loadingInterceptor } from '../core/http/loading-interceptor';
import { AuthService } from '../core/services/auth-service';
import { IncidentStore } from '../core/state/incident-store';
import { IncidentApi } from '../core/api/incident-api';
import { INCIDENT_REPOSITORY, USER_REPOSITORY, AUTH_GATEWAY } from '../core/di/tokens';
import { UserService } from '../core/services/user-service';

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
  tick();

  return store;
}