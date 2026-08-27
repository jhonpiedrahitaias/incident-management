import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth-service';
import { LoadingService } from '../services/loading-service';
import { CREATE_INCIDENT, LIST_INCIDENTS, SESSION_STORE } from '../di/tokens';
import { IncidentStore } from '../state/incident-store';
import { Incident, IncidentDraft, IncidentPriorityEnum } from '../../domain/models/incident.model';
import { MOCK_INCIDENTS } from '../mocks/incidents.mock';
import {
  CREDENTIALS_BY_ROLE,
  loadIncidents,
  prepareApi,
  provideTestApi,
} from '../../../testing/api-testing';
import { failNextApiRequest } from '../api/fake-backend-interceptor';
import { authTokenInterceptor } from './auth-token-interceptor';
import { correlationIdInterceptor, CORRELATION_ID_HEADER } from './correlation-id-interceptor';
import { AppHttpError, errorHandlingInterceptor } from './error-handling-interceptor';
import { loadingInterceptor } from './loading-interceptor';
import { SessionStorageSessionStore} from '../services/session-storage-session-store';

const DRAFT: IncidentDraft = {
  title: 'Fuga en el aire acondicionado',
  description: 'Gotea sobre los equipos del rack principal.',
  category: 'Infraestructura',
  priority: IncidentPriorityEnum.HIGH,
  reporterId: 'u-005',
};

describe('cadena HTTP de extremo a extremo', () => {
  describe('contra el backend simulado', () => {
    let store: IncidentStore;

    beforeEach(() => {
      prepareApi();
      TestBed.configureTestingModule({ providers: [provideTestApi()] });
    });

    it('consulta las incidencias y las deja en el store', fakeAsync(() => {
      store = loadIncidents();

      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length);
      expect(store.error()).toBeNull();
    }));

    it('crea una incidencia y persiste en el servidor', fakeAsync(() => {
      store = loadIncidents();

      let created: Incident | undefined;
      TestBed.inject(CREATE_INCIDENT).execute(DRAFT).subscribe((incident) => (created = incident));
      tick();

      // Se recarga desde cero: si solo estuviera en memoria, desaparecería.
      TestBed.inject(LIST_INCIDENTS)
        .execute()
        .subscribe({
          error: (failure: Error) => {
            store.markLoaded();
            store.setError(failure.message);
          },
        });
      tick();

      expect(store.getById(created!.id)?.title).toBe(DRAFT.title);
    }));

    it('un 404 llega al store con mensaje legible, no como código', fakeAsync(() => {
      store = loadIncidents();

      let failure: Error | undefined;
      store.remove('inc-999').subscribe({ error: (error) => (failure = error) });
      tick();

      expect(failure?.message).toContain('No existe la incidencia');
      // Lo que llega es un AppHttpError, no un HttpErrorResponse: un Error
      // corriente con el mensaje ya traducido. Conserva el código y el
      // identificador de correlación como metadatos para soporte, pero
      // nadie tiene que interpretarlos para mostrar el fallo.
      expect(failure).toEqual(jasmine.any(AppHttpError));
      expect((failure as AppHttpError).status).toBe(404);
      expect((failure as AppHttpError).correlationId).toBeTruthy();
      expect(store.error()).toBe(failure!.message);
    }));

    it('un 500 deja el indicador de carga apagado', fakeAsync(() => {
      const loadingService = TestBed.inject(LoadingService);
      failNextApiRequest();

      store = loadIncidents();

      expect(store.error()).toBeTruthy();
      expect(loadingService.loading()).toBe(false);
      expect(loadingService.pendingCount()).toBe(0);
    }));
  });

  describe('cabeceras que añaden los interceptores', () => {
    let http: HttpClient;
    let backend: HttpTestingController;
    let authService: AuthService;

    beforeEach(() => {
      prepareApi();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(
            withInterceptors([
              correlationIdInterceptor,
              authTokenInterceptor,
              loadingInterceptor,
              errorHandlingInterceptor,
            ]),
          ),
          provideHttpClientTesting(),
          // Este bloque monta su propio inyector para controlar la cadena de
          // interceptores, así que tiene que cablear también el puerto de
          // sesión: cada raíz de composición elige sus adaptadores.
          { provide: SESSION_STORE, useExisting: SessionStorageSessionStore },
        ],
      });

      http = TestBed.inject(HttpClient);
      backend = TestBed.inject(HttpTestingController);
      authService = TestBed.inject(AuthService);
    });

    afterEach(() => backend.verify());

    it('sin sesión no se manda cabecera de autorización', () => {
      http.get('/api/incidents').subscribe();

      const request = backend.expectOne('/api/incidents');
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush([]);
    });

    it('con sesión, cada petición lleva el token', async () => {
      const token = await signIn();

      http.get('/api/incidents').subscribe();

      const request = backend.expectOne('/api/incidents');
      expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      request.flush([]);
    });

    it('el inicio de sesión no lleva token: es la petición que lo pide', async () => {
      await signIn();

      http.post('/api/auth/login', {}).subscribe({ error: () => undefined });

      const request = backend.expectOne('/api/auth/login');
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    });

    it('tras cerrar sesión deja de mandarse', async () => {
      await signIn();
      authService.logout();

      http.get('/api/incidents').subscribe();

      const request = backend.expectOne('/api/incidents');
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush([]);
    });

    it('la correlación viaja junto al token, sin pisarse', async () => {
      await signIn();

      http.get('/api/incidents').subscribe();

      const request = backend.expectOne('/api/incidents');
      expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(true);
      expect(request.request.headers.has('Authorization')).toBe(true);
      request.flush([]);
    });

    /** Inicia sesión de verdad y devuelve el token emitido. */
    async function signIn(): Promise<string> {
      const login = firstValueFrom(authService.login(CREDENTIALS_BY_ROLE.ADMIN));

      const request = backend.expectOne('/api/auth/login');
      request.flush({
        token: 'token-de-prueba',
        user: { id: 'u-001', name: 'Ana', email: 'a@b.c', role: 'ADMIN' },
        expiresAt: Date.now() + 3_600_000,
      });

      await login;
      return 'token-de-prueba';
    }
  });
});