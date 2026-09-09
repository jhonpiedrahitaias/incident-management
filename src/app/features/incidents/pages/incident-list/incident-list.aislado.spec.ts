import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Incident, IncidentPriorityEnum, IncidentStatusEnum } from '../../../../core/domain/models/incident.model';
import { IncidentList } from './incident-list';
import { IncidentRepository } from '../../../../core/domain/ports/incident-repository.port';
import { IncidentStore } from '../../../../core/infrastructure/state/incident-store';
import {
  CHANGE_INCIDENTS_STATUS,
  INCIDENT_REPOSITORY,
  LIST_INCIDENTS,
  SESSION,
  UPDATE_INCIDENT_STATUS,
} from '../../../../core/infrastructure/di/tokens';
import { ChangeIncidentsStatusUseCase } from '../../../../core/application/use-cases/change-incidents-status.use-case';
import { UpdateIncidentStatusUseCase } from '../../../../core/application/use-cases/update-incident-status.use-case';
import { signal } from '@angular/core';
import { ListIncidentsUseCase } from '../../../../core/application/use-cases/list-incidents.use-case';

/**
 * Pruebas **aisladas** del listado.
 *
 * Este archivo convive con `incident-list.spec.ts` y no lo sustituye. Prueban
 * cosas distintas y las dos hacen falta:
 *
 * | Archivo | Qué monta | Qué responde |
 * |---|---|---|
 * | `incident-list.spec.ts` | la cadena real: interceptores + backend simulado | ¿funciona el conjunto de verdad? |
 * | **este** | espías en los puertos, cero HTTP | ¿hace el componente lo suyo? |
 *
 * La diferencia práctica: aquí el dato de entrada se **decide**. Para probar
 * «no hay incidencias» basta con que el espía devuelva `[]`; con la cadena
 * real había que borrarlas todas una por una a través de la interfaz.
 *
 * Esto es posible porque el componente depende de **puertos**
 * (`LIST_INCIDENTS`, `INCIDENT_REPOSITORY`) y no de clases concretas. Antes
 * inyectaba `IncidentApi` directamente y no había forma de sustituirlo sin
 * levantar `HttpClient` entero.
 */
describe('IncidentList (aislado con espías)', () => {
  let fixture: ComponentFixture<IncidentList>;
  let repositorio: jasmine.SpyObj<IncidentRepository>;

  const INCIDENCIAS: Incident[] = [
    {
      id: 'inc-001',
      title: 'La impresora no responde',
      description: 'No imprime desde ayer',
      category: 'Hardware',
      priority: IncidentPriorityEnum.CRITICAL,
      status: IncidentStatusEnum.OPEN,
      reporterId: 'u-004',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'inc-002',
      title: 'El correo no llega',
      description: 'Bandeja vacía desde las 9',
      category: 'Software',
      priority: IncidentPriorityEnum.LOW,
      status: IncidentStatusEnum.CLOSED,
      reporterId: 'u-005',
      createdAt: '2026-08-02T10:00:00.000Z',
      updatedAt: '2026-08-02T10:00:00.000Z',
    },
  ];

  /**
   * Monta el componente con un repositorio espiado.
   *
   * Recibe qué debe devolver `getAll`, que es lo que permite escribir el caso
   * «con datos» y el caso «vacío» sin tocar nada más.
   */
  async function montar(datos: Incident[]): Promise<void> {
    await configurar(datos);
    crear();
  }

  /** Solo configura el inyector. No crea el componente. */
  async function configurar(datos: Incident[]): Promise<void> {
    repositorio = jasmine.createSpyObj<IncidentRepository>('IncidentRepository', [
      'getAll',
      'search',
      'getById',
      'create',
      'update',
      'remove',
    ]);
    repositorio.getAll.and.returnValue(of(datos));
    repositorio.search.and.returnValue(of([]));
    repositorio.remove.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [IncidentList],
      providers: [
        provideRouter([]),
        // Ni `provideHttpClient`, ni interceptores, ni backend simulado: el
        // componente no llega a saber que HTTP existe.
        { provide: INCIDENT_REPOSITORY, useValue: repositorio },
        // Desde el Día 10 la lista pide el **puerto** `SESSION`, no
        // `AuthService`. El doble solo implementa lo que el componente usa,
        // que es justo lo que un puerto permite: antes había que sustituir
        // una clase entera que además hablaba HTTP.
        { provide: SESSION, useValue: { canManageIncidents: signal(true) } },
        {
          provide: UPDATE_INCIDENT_STATUS,
          useFactory: () =>
            new UpdateIncidentStatusUseCase(
              TestBed.inject(INCIDENT_REPOSITORY),
              TestBed.inject(IncidentStore),
            ),
        },
        {
          provide: CHANGE_INCIDENTS_STATUS,
          useFactory: () =>
            new ChangeIncidentsStatusUseCase(TestBed.inject(UPDATE_INCIDENT_STATUS)),
        },
        {
          provide: LIST_INCIDENTS,
          useFactory: () =>
            new ListIncidentsUseCase(TestBed.inject(INCIDENT_REPOSITORY), TestBed.inject(IncidentStore)),
        },
      ],
    }).compileComponents();

  }

  /**
   * Crea el componente. **Síncrona a propósito.**
   *
   * Está separada de `configurar` por un motivo que cuesta descubrir: si el
   * componente se crea fuera de la zona de `fakeAsync`, el efecto interno de
   * `toObservable` —el que alimenta el buscador— queda registrado en la zona
   * real, y ningún `tick()` posterior lo mueve. Las pruebas que manipulan el
   * tiempo tienen que crearlo **dentro** de su propio `fakeAsync`.
   */
  function crear(): void {
    // Quien dispara la consulta inicial es el componente raíz de la
    // aplicación, no esta página. Al montarla sola hay que hacerlo a mano, y
    // conviene saberlo: es una dependencia real que la prueba integrada
    // esconde porque allí el arranque ya la cubre.
    TestBed.inject(LIST_INCIDENTS).execute().subscribe();

    fixture = TestBed.createComponent(IncidentList);
    // Página grande para que la paginación no esconda resultados.
    TestBed.inject(IncidentStore).setPageSize(50);
    fixture.detectChanges();
  }

  // --- Criterio 1: render correcto con datos --------------------------------

  describe('render con datos', () => {
    beforeEach(async () => montar(INCIDENCIAS));

    it('pinta una tarjeta por incidencia', () => {
      expect(tarjetas().length).toBe(2);
    });

    it('muestra los títulos que devolvió el repositorio', () => {
      expect(texto()).toContain('La impresora no responde');
      expect(texto()).toContain('El correo no llega');
    });

    it('calcula los indicadores a partir de esos datos', () => {
      // Una CRITICAL y una OPEN de las dos: los contadores son derivados,
      // así que probarlos con datos elegidos verifica el cálculo, no el azar
      // del conjunto de demostración.
      expect(indicador('Totales')).toBe('2');
      expect(indicador('Críticas')).toBe('1');
      expect(indicador('Abiertas')).toBe('1');
    });

    it('pidió los datos al puerto exactamente una vez', () => {
      // Sin espía esto no se puede afirmar: es la ventaja de aislar.
      expect(repositorio.getAll).toHaveBeenCalledTimes(1);
    });
  });

  // --- Criterio 2: comportamiento ante datos vacíos --------------------------

  describe('sin datos', () => {
    beforeEach(async () => montar([]));

    it('no pinta ninguna tarjeta', () => {
      expect(tarjetas().length).toBe(0);
    });

    it('muestra el mensaje de lista vacía', () => {
      // El `@empty` del `@for`. Con la cadena real había que borrar todas las
      // incidencias por la interfaz para llegar hasta aquí.
      expect(texto()).toContain('No hay incidencias registradas.');
    });

    it('los indicadores quedan a cero en vez de en blanco', () => {
      expect(indicador('Totales')).toBe('0');
      expect(indicador('Críticas')).toBe('0');
    });

    it('una lista vacía no es un error: no se muestra aviso de fallo', () => {
      expect(texto()).not.toContain('No se pudieron cargar');
    });
  });

  // --- Criterio 3: interacción del usuario simulada --------------------------

  describe('interacción del usuario', () => {
    beforeEach(async () => montar(INCIDENCIAS));

    it('al recargar vuelve a pedir los datos al puerto', () => {
      pulsarEn(fixture.nativeElement, 'Recargar');

      expect(repositorio.getAll).toHaveBeenCalledTimes(2);
    });

    it('al escribir en el buscador consulta el puerto tras la espera', fakeAsync(() => {
      recrearEnZonaFalsa();

      escribir('#search-term', 'impresora');
      // El componente amortigua 300 ms para no pedir en cada tecla. El
      // `detectChanges` de después hace falta porque el término viaja por
      // `toObservable`, que se propaga en un efecto, no de forma inmediata.
      tick(300);
      fixture.detectChanges();

      expect(repositorio.search).toHaveBeenCalledWith('impresora');
      tick(1000);
    }));

    it('no consulta al escribir si no ha pasado la espera', fakeAsync(() => {
      recrearEnZonaFalsa();

      escribir('#search-term', 'imp');
      tick(100);

      expect(repositorio.search).not.toHaveBeenCalled();
      tick(1000);
    }));

    it('eliminar una incidencia la pide al puerto y la quita de la lista', fakeAsync(() => {
      pulsarEn(tarjetaDe('La impresora no responde'), 'Eliminar incidencia');
      fixture.detectChanges();
      // La confirmación se busca dentro del diálogo: en la página hay otros
      // botones cuyo texto empieza por «Eliminar».
      pulsarEn(fixture.nativeElement.querySelector('dialog[open]'), 'Eliminar');
      tick();
      fixture.detectChanges();

      expect(repositorio.remove).toHaveBeenCalledWith('inc-001');
      expect(texto()).not.toContain('La impresora no responde');
    }));
  });

  // --- Extra: el fallo, que con datos reales cuesta provocar -----------------

  describe('cuando el puerto falla', () => {
    it('no rompe la pantalla', async () => {
      await montar([]);
      repositorio.getAll.and.returnValue(throwError(() => new Error('sin red')));

      pulsarEn(fixture.nativeElement, 'Recargar');

      // Provocar esto con la cadena real exige un interceptor que finja el
      // fallo; con un espía es una línea.
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  // --- Utilidades -----------------------------------------------------------

  /**
   * Vuelve a montar el componente dentro de la zona de `fakeAsync` actual.
   *
   * Necesario solo para las pruebas que adelantan el reloj: ver el comentario
   * de `crear()`.
   */
  function recrearEnZonaFalsa(): void {
    fixture.destroy();
    repositorio.getAll.calls.reset();
    repositorio.search.calls.reset();
    crear();
  }


  function tarjetas(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-incident-card'));
  }

  function tarjetaDe(titulo: string): HTMLElement {
    return tarjetas().find((tarjeta) => tarjeta.textContent?.includes(titulo))!;
  }

  function texto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  function indicador(etiqueta: string): string {
    const item = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.stats-item'),
    ).find((candidato) => candidato.querySelector('.stats-label')?.textContent?.trim() === etiqueta);

    return item?.querySelector('.stats-value')?.textContent?.trim() ?? '';
  }

  function pulsarEn(raiz: HTMLElement, texto: string): void {
    // Se busca por el **nombre accesible**: algunos botones solo llevan un
    // icono y su nombre está en `aria-label`. Buscar solo por `textContent`
    // los dejaría fuera, que es justo lo que le pasa al de eliminar.
    const boton = Array.from<HTMLButtonElement>(raiz.querySelectorAll('button')).find(
      (candidato) =>
        (candidato.getAttribute('aria-label') ?? candidato.textContent ?? '')
          .trim()
          .startsWith(texto),
    );

    boton!.click();
    fixture.detectChanges();
  }

  function escribir(selector: string, valor: string): void {
    const campo: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
});