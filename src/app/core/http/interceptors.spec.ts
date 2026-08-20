import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { LoadingService } from '../services/loading-service';
import { CORRELATION_ID_HEADER, correlationIdInterceptor } from './correlation-id-interceptor';
import { errorHandlingInterceptor, AppHttpError } from './error-handling-interceptor.spec';
import { loadingInterceptor } from './loading-interceptor';

const URL = '/api/incidents';

describe('Interceptores HTTP', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([correlationIdInterceptor, loadingInterceptor, errorHandlingInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  describe('Interceptor de correlación', () => {
    it('Añade la cabecera de correlación a la petición', () => {
      http.get(URL).subscribe();

      const request = backend.expectOne(URL);

      expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(true);
      expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();
      request.flush([]);
    });

    it('Usa un identificador distinto en cada petición', () => {
      http.get(URL).subscribe();
      http.get(URL).subscribe();

      const [first, second] = backend.match(URL);
      const firstId = first.request.headers.get(CORRELATION_ID_HEADER);
      const secondId = second.request.headers.get(CORRELATION_ID_HEADER);

      expect(firstId).not.toBe(secondId);
      first.flush([]);
      second.flush([]);
    });

    it('No altera el resto de la petición', () => {
      http.post(URL, { title: 'Una incidencia' }).subscribe();

      const request = backend.expectOne(URL);

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ title: 'Una incidencia' });
      request.flush({});
    });
  });

  describe('Interceptor de manejo de errores', () => {
    const cases: readonly (readonly [number, string])[] = [
      [400, 'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.'],
      [401, 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],
      [403, 'No tienes permisos para realizar esta acción.'],
      [404, 'El recurso solicitado no existe.'],
      [500, 'El servidor no pudo procesar la solicitud. Inténtalo más tarde.'],
    ];

    for (const [status, message] of cases) {
      it(`Traduce el ${status} a su mensaje`, () => {
        const failure = failWith(status);

        expect(failure?.message).toBe(message);
        expect(failure?.status).toBe(status);
      });
    }

    it('Avisa de la falta de conexión cuando la petición no llega a salir', () => {
      let failure: AppHttpError | undefined;
      http.get(URL).subscribe({ error: (error) => (failure = error) });

      backend.expectOne(URL).error(new ProgressEvent('error'));

      expect(failure?.message).toBe('No hay conexión con el servidor. Comprueba tu red.');
    });

    it('Prefiere el mensaje que envía el servidor', () => {
      let failure: AppHttpError | undefined;
      http.get(URL).subscribe({ error: (error) => (failure = error) });

      backend
        .expectOne(URL)
        .flush({ message: 'Mantenimiento programado.' }, { status: 503, statusText: 'x' });

      expect(failure?.message).toBe('Mantenimiento programado.');
    });

    it('Tiene un mensaje de respaldo para códigos no contemplados', () => {
      expect(failWith(418)?.message).toBe('Error inesperado del servidor (418).');
    });

    it('El error entrega el identificador de correlación para soporte', () => {
      const failure = failWith(500);

      expect(failure?.correlationId).toBeTruthy();
    });

    it('El error que reciben los servicios ya no es un HttpErrorResponse', () => {
      const failure = failWith(500);

      expect(failure).toEqual(jasmine.any(AppHttpError));
      expect(failure).toEqual(jasmine.any(Error));
    });

    /** Lanza una petición que falla con el código dado y devuelve el error. */
    function failWith(status: number): AppHttpError | undefined {
      let failure: AppHttpError | undefined;
      http.get(URL).subscribe({ error: (error) => (failure = error) });

      backend.expectOne(URL).flush(null, { status, statusText: 'Error' });

      return failure;
    }
  });

  describe('Interceptor de carga', () => {
    let loadingService: LoadingService;

    beforeEach(() => (loadingService = TestBed.inject(LoadingService)));

    it('Marca la carga mientras la petición está en vuelo', () => {
      expect(loadingService.loading()).toBe(false);

      http.get(URL).subscribe();
      expect(loadingService.loading()).toBe(true);

      backend.expectOne(URL).flush([]);
      expect(loadingService.loading()).toBe(false);
    });
  });
});