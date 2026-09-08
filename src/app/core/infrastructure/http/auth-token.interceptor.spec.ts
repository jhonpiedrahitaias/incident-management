import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { AuthService } from '../services/auth-service';
import { authTokenInterceptor } from './auth-token-interceptor';

/**
 * Pruebas del interceptor que adjunta el token de sesión.
 */
describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const token = signal<string | null>(null);

  beforeEach(() => {
    token.set(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token } },
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  describe('con sesión iniciada', () => {
    beforeEach(() => token.set('token-de-prueba'));

    it('adjunta la cabecera Authorization con el esquema Bearer', () => {
      http.get('/api/incidents').subscribe();

      const peticion = backend.expectOne('/api/incidents');
      expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
      peticion.flush([]);
    });

    it('la adjunta en cualquier verbo, no solo en GET', () => {
      // Si solo la pusiera en las lecturas, las escrituras irían sin
      // credencial y el servidor las rechazaría.
      http.post('/api/incidents', {}).subscribe();

      const peticion = backend.expectOne('/api/incidents');
      expect(peticion.request.headers.get('Authorization')).toBeTruthy();
      peticion.flush({});
    });

    it('usa el token vigente en cada petición, no el del arranque', () => {
      http.get('/api/incidents').subscribe();
      backend.expectOne('/api/incidents').flush([]);

      token.set('token-renovado');
      http.get('/api/incidents').subscribe();

      // Lee la señal en cada llamada: si guardara el valor al construirse,
      // tras renovar la sesión seguiría mandando el token caducado.
      const segunda = backend.expectOne('/api/incidents');
      expect(segunda.request.headers.get('Authorization')).toBe('Bearer token-renovado');
      segunda.flush([]);
    });

    it('no toca el resto de la petición', () => {
      http.post('/api/incidents', { title: 'algo' }, { headers: { 'X-Otra': 'valor' } }).subscribe();

      const peticion = backend.expectOne('/api/incidents');
      expect(peticion.request.body).toEqual({ title: 'algo' });
      expect(peticion.request.headers.get('X-Otra')).toBe('valor');
      peticion.flush({});
    });

    it('NO la adjunta al iniciar sesión', () => {
      // Pedir un token con un token es absurdo, y es justo la petición que
      // se hace cuando no hay ninguno.
      http.post('/api/auth/login', {}).subscribe();

      const peticion = backend.expectOne('/api/auth/login');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    });

    it('la exclusión cubre todo el espacio /auth/, no solo el login', () => {
      http.post('/api/auth/refresh', {}).subscribe();

      const peticion = backend.expectOne('/api/auth/refresh');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush({});
    });

    it('una URL que solo contiene «auth» sin ser del espacio sí la lleva', () => {
      // La exclusión compara por prefijo. Una incidencia de categoría
      // «autenticación» no debe quedarse sin credencial por el nombre.
      http.get('/api/incidents?search=auth').subscribe();

      const peticion = backend.expectOne('/api/incidents?search=auth');
      expect(peticion.request.headers.has('Authorization')).toBe(true);
      peticion.flush([]);
    });
  });

  describe('sin sesión', () => {
    it('no inventa una cabecera vacía', () => {
      // Mandar «Bearer null» sería peor que no mandar nada: el servidor
      // devolvería un error de token inválido en vez de uno de falta de
      // autenticación, y el mensaje al usuario sería el equivocado.
      http.get('/api/incidents').subscribe();

      const peticion = backend.expectOne('/api/incidents');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush([]);
    });

    it('con el token vacío tampoco', () => {
      token.set('');

      http.get('/api/incidents').subscribe();

      const peticion = backend.expectOne('/api/incidents');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush([]);
    });

    it('la petición sigue saliendo: el interceptor no bloquea', () => {
      // No es su trabajo decidir quién puede pedir qué. Eso es del guard en
      // el cliente y del servidor de verdad.
      let respondio = false;
      http.get('/api/incidents').subscribe(() => (respondio = true));

      backend.expectOne('/api/incidents').flush([]);

      expect(respondio).toBe(true);
    });
  });
});