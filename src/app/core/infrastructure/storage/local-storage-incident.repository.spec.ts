import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { ListIncidentsUseCase } from "../../application/use-cases/list-incidents.use-case";
import { Incident } from "../../domain/models/incident.model";
import { INCIDENT_REPOSITORY, INCIDENT_CACHE, LIST_INCIDENTS } from "../di/tokens";
import { MOCK_INCIDENTS } from "../mocks/incidents.mock";
import { IncidentStore } from "../state/incident-store";
import { LocalStorageIncidentRepository } from "./local-storage-incident.repository";


const CLAVE = 'incident-management.incidents';

describe('LocalStorageIncidentRepository', () => {
  let repositorio: LocalStorageIncidentRepository;

  const nueva = (id: string): Incident =>
    ({
      id,
      title: `Incidencia ${id}`,
      description: 'Da igual',
      category: 'Pruebas',
      priority: 'LOW',
      status: 'OPEN',
      reporterId: 'u-001',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }) as Incident;

  /** Lo que hay de verdad en el disco, sin pasar por el adaptador. */
  const enDisco = (): Incident[] => JSON.parse(localStorage.getItem(CLAVE) ?? '[]');

  beforeEach(() => {
    // `localStorage` es real y sobrevive entre pruebas: sin esto, una
    // arrastraría lo que guardó la anterior y los fallos dependerían del
    // orden de ejecución.
    localStorage.clear();
    TestBed.configureTestingModule({});
    repositorio = TestBed.inject(LocalStorageIncidentRepository);
  });

  afterEach(() => localStorage.clear());

  describe('siembra inicial', () => {
    it('en la primera visita deja el juego de demostración', async () => {
      // Sin esto la aplicación abriría vacía y no habría nada que enseñar.
      const incidencias = await firstValueFrom(repositorio.getAll());

      expect(incidencias.length).toBe(MOCK_INCIDENTS.length);
    });

    it('la siembra se escribe en disco, no solo se devuelve', async () => {
      await firstValueFrom(repositorio.getAll());

      expect(enDisco().length).toBe(MOCK_INCIDENTS.length);
    });

    it('no vuelve a sembrar si el usuario lo dejó vacío a propósito', async () => {
      localStorage.setItem(CLAVE, '[]');

      const incidencias = await firstValueFrom(repositorio.getAll());

      // Una lista vacía guardada es una decisión, no una primera visita.
      // Resembrar aquí resucitaría lo que alguien acaba de borrar.
      expect(incidencias).toEqual([]);
    });
  });

  describe('persistencia', () => {
    it('lo creado sobrevive a una instancia nueva del adaptador', async () => {
      await firstValueFrom(repositorio.create(nueva('inc-900')));

      // Equivale a recargar la página: el adaptador se construye de cero.
      const otro = new LocalStorageIncidentRepository();
      const incidencias = await firstValueFrom(otro.getAll());

      expect(incidencias.some((i) => i.id === 'inc-900')).toBe(true);
    });

    it('crear escribe en disco', async () => {
      const antes = enDisco().length || MOCK_INCIDENTS.length;
      await firstValueFrom(repositorio.getAll());

      await firstValueFrom(repositorio.create(nueva('inc-901')));

      expect(enDisco().length).toBe(antes + 1);
    });

    it('actualizar sustituye y no duplica', async () => {
      await firstValueFrom(repositorio.create(nueva('inc-902')));
      const antes = enDisco().length;

      await firstValueFrom(
        repositorio.update({ ...nueva('inc-902'), title: 'Título corregido' }),
      );

      expect(enDisco().length).toBe(antes);
      expect(enDisco().find((i) => i.id === 'inc-902')!.title).toBe('Título corregido');
    });

    it('eliminar lo quita del disco', async () => {
      await firstValueFrom(repositorio.create(nueva('inc-903')));

      await firstValueFrom(repositorio.remove('inc-903'));

      expect(enDisco().some((i) => i.id === 'inc-903')).toBe(false);
    });
  });

  describe('búsqueda', () => {
    it('encuentra por título y por descripción', async () => {
      const resultado = await firstValueFrom(repositorio.search('impresora'));

      expect(resultado.length).toBeGreaterThan(0);
    });

    it('no distingue mayúsculas', async () => {
      const minusculas = await firstValueFrom(repositorio.search('impresora'));
      const mayusculas = await firstValueFrom(repositorio.search('IMPRESORA'));

      expect(mayusculas.length).toBe(minusculas.length);
    });

    it('un término vacío devuelve todo, igual que hacía el servidor', async () => {
      const todas = await firstValueFrom(repositorio.getAll());

      expect((await firstValueFrom(repositorio.search('   '))).length).toBe(todas.length);
    });

    it('sin coincidencias devuelve lista vacía, no un error', async () => {
      expect(await firstValueFrom(repositorio.search('no-existe-esto'))).toEqual([]);
    });
  });

  describe('errores', () => {
    it('pedir una incidencia inexistente falla con un mensaje legible', async () => {
      await expectAsync(firstValueFrom(repositorio.getById('inc-999'))).toBeRejectedWithError(
        /No existe la incidencia inc-999/,
      );
    });

    it('actualizar algo que no existe falla en vez de crearlo', async () => {
      // Guardarla igualmente la crearía de la nada, que no es actualizar.
      await expectAsync(
        firstValueFrom(repositorio.update(nueva('inc-999'))),
      ).toBeRejected();
      expect(enDisco().some((i) => i.id === 'inc-999')).toBe(false);
    });

    it('eliminar algo que no existe falla', async () => {
      await expectAsync(firstValueFrom(repositorio.remove('inc-999'))).toBeRejected();
    });
  });

  describe('datos corruptos en el disco', () => {
    it('un contenido que no es JSON no rompe la aplicación', async () => {
      localStorage.setItem(CLAVE, 'esto no es JSON');

      // Alguien lo pudo editar a mano desde la consola, o venir de otra
      // versión de la aplicación.
      expect(await firstValueFrom(repositorio.getAll())).toEqual([]);
    });

    it('un JSON que no es una lista tampoco', async () => {
      localStorage.setItem(CLAVE, '{"no":"soy una lista"}');

      expect(await firstValueFrom(repositorio.getAll())).toEqual([]);
    });
  });

  describe('la aplicación entera funciona sobre este adaptador', () => {
    it('el store carga las incidencias sin HttpClient ni interceptores', () => {
      TestBed.resetTestingModule();
      localStorage.clear();
      TestBed.configureTestingModule({
        providers: [
          // Ni provideHttpClient, ni cadena de interceptores, ni backend
          // simulado: exactamente lo que se buscaba con los puertos.
          { provide: INCIDENT_REPOSITORY, useExisting: LocalStorageIncidentRepository },
          { provide: INCIDENT_CACHE, useExisting: IncidentStore },
          {
            provide: LIST_INCIDENTS,
            useFactory: () =>
              new ListIncidentsUseCase(
                TestBed.inject(INCIDENT_REPOSITORY),
                TestBed.inject(INCIDENT_CACHE),
              ),
          },
        ],
      });

      TestBed.inject(LIST_INCIDENTS).execute().subscribe();

      expect(TestBed.inject(IncidentStore).incidents().length).toBe(MOCK_INCIDENTS.length);
    });
  });
});