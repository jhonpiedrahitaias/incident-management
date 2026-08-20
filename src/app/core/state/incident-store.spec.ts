import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { IncidentStore } from './incident-store';
import { MOCK_INCIDENTS } from '../mocks/incidents.mock';
import { Incident, IncidentDraft } from '../models/incident.model';
import { loadIncidents, prepareApi, provideTestApi } from '../../testing/api-testing';
import { failNextApiRequest } from '../api/fake-backend-interceptor';

const DRAFT: IncidentDraft = {
  title: 'Fuga en el aire acondicionado',
  description: 'Gotea sobre los equipos del rack principal.',
  category: 'Infraestructura',
  priority: 'HIGH',
  reporterId: 'u-005',
};

describe('IncidentStore', () => {
  let store: IncidentStore;

  beforeEach(() => {
    prepareApi();
    TestBed.configureTestingModule({ providers: [provideTestApi()] });
  });

  /** Crea el servicio y espera a su carga inicial. */
  function start(): void {
    store = loadIncidents();
  }

  it('Debería crearse', fakeAsync(() => {
    start();
    expect(store).toBeTruthy();
  }));

  it('Se comparte como única instancia en toda la aplicación', fakeAsync(() => {
    start();
    expect(TestBed.inject(IncidentStore)).toBe(store);
  }));

  describe('carga inicial', () => {
    it('Pide las incidencias al crearse', fakeAsync(() => {
      start();

      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length);
      expect(store.loaded()).toBe(true);
    }));

    it('Mientras carga marca loading y luego lo apaga', fakeAsync(() => {
      const pending = TestBed.inject(IncidentStore);
      expect(pending.loading()).toBe(true);

      tick();

      expect(pending.loading()).toBe(false);
    }));

    it('No hay error tras una carga correcta', fakeAsync(() => {
      start();
      expect(store.error()).toBeNull();
    }));
  });

  describe('consulta', () => {
    beforeEach(fakeAsync(() => start()));

    it('Devuelve un arreglo nuevo, no la colección interna', () => {
      expect(store.getAll()).not.toBe(store.getAll());
    });

    it('Modificar lo devuelto no altera el estado del servicio', () => {
      (store.getAll() as Incident[]).length = 0;

      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length);
    });

    it('busca por identificador', () => {
      expect(store.getById('inc-001')?.title).toBe(MOCK_INCIDENTS[0].title);
    });

    it('Devuelve undefined si el identificador no existe', () => {
      expect(store.getById('no-existe')).toBeUndefined();
    });
  });

  describe('creación', () => {
    beforeEach(fakeAsync(() => start()));

    it('Añade la incidencia y completa lo que decide el dominio', fakeAsync(() => {
      let created: Incident | undefined;
      store.create(DRAFT).subscribe((incident) => (created = incident));
      tick();

      expect(created!.id).toBe('inc-006');
      expect(created!.status).toBe('OPEN');
      expect(created!.createdAt).toBe(created!.updatedAt);
      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length + 1);
    }));

    it('La colección solo cambia cuando el servidor confirma', fakeAsync(() => {
      store.create(DRAFT).subscribe();

      // Aún sin respuesta: nada de optimismo prematuro.
      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length);

      tick();

      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length + 1);
    }));

    it('La incidencia persiste en el servidor', fakeAsync(() => {
      store.create(DRAFT).subscribe();
      tick();

      // Se recarga desde cero: si solo estuviera en memoria, desaparecería.
      store.load();
      tick();

      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length + 1);
    }));

    it('genera identificadores distintos en creaciones sucesivas', fakeAsync(() => {
      store.create(DRAFT).subscribe();
      tick();
      let second: Incident | undefined;
      store.create(DRAFT).subscribe((incident) => (second = incident));
      tick();

      expect(second!.id).toBe('inc-007');
    }));
  });

  describe('actualización', () => {
    beforeEach(fakeAsync(() => start()));

    it('Aplica cambios parciales sin tocar el resto', fakeAsync(() => {
      const original = MOCK_INCIDENTS[0];
      let updated: Incident | undefined;

      store.update(original.id, { title: 'Título corregido' }).subscribe((i) => (updated = i));
      tick();

      expect(updated!.title).toBe('Título corregido');
      expect(updated!.description).toBe(original.description);
    }));

    it('Conserva id y createdAt, y refresca updatedAt', fakeAsync(() => {
      const original = MOCK_INCIDENTS[0];
      let updated: Incident | undefined;

      store.update(original.id, { title: 'Título corregido' }).subscribe((i) => (updated = i));
      tick();

      expect(updated!.id).toBe(original.id);
      expect(updated!.createdAt).toBe(original.createdAt);
      expect(updated!.updatedAt).not.toBe(original.updatedAt);
    }));

    it('Los cambios persisten en el servidor', fakeAsync(() => {
      store.update('inc-001', { priority: 'CRITICAL' }).subscribe();
      tick();

      store.load();
      tick();

      expect(store.getById('inc-001')?.priority).toBe('CRITICAL');
    }));

    it('Recalcula los indicadores derivados', fakeAsync(() => {
      const before = store.criticalCount();

      store.update('inc-001', { priority: 'CRITICAL' }).subscribe();
      tick();

      expect(store.criticalCount()).toBe(before + 1);
    }));
  });

  describe('eliminación', () => {
    beforeEach(fakeAsync(() => start()));

    it('Elimina la incidencia', fakeAsync(() => {
      store.remove('inc-001').subscribe();
      tick();

      expect(store.getById('inc-001')).toBeUndefined();
      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length - 1);
    }));

    it('La eliminación persiste en el servidor', fakeAsync(() => {
      store.remove('inc-001').subscribe();
      tick();

      store.load();
      tick();

      expect(store.getById('inc-001')).toBeUndefined();
    }));

    it('Informa del error si la incidencia no existe', fakeAsync(() => {
      let failed: Error | undefined;
      store.remove('no-existe').subscribe({ error: (e) => (failed = e) });
      tick();

      expect(failed?.message).toContain('No existe la incidencia');
      expect(store.error()).toBeTruthy();
    }));
  });

  describe('indicadores derivados', () => {
    beforeEach(fakeAsync(() => start()));

    it('Cuentan el total, las críticas y las abiertas', () => {
      expect(store.totalCount()).toBe(MOCK_INCIDENTS.length);
      expect(store.criticalCount()).toBe(
        MOCK_INCIDENTS.filter((i) => i.priority === 'CRITICAL').length,
      );
      expect(store.openCount()).toBe(MOCK_INCIDENTS.filter((i) => i.status === 'OPEN').length);
    });

    it('Se recalculan solos al eliminar', fakeAsync(() => {
      const critical = MOCK_INCIDENTS.find((i) => i.priority === 'CRITICAL')!;

      store.remove(critical.id).subscribe();
      tick();

      expect(store.criticalCount()).toBe(
        MOCK_INCIDENTS.filter((i) => i.priority === 'CRITICAL').length - 1,
      );
    }));

    it('Son de solo lectura', () => {
      expect('set' in store.totalCount).toBe(false);
      expect('update' in store.totalCount).toBe(false);
    });
  });

  describe('errores', () => {
    it('Registra el mensaje cuando la carga inicial falla', fakeAsync(() => {
      failNextApiRequest();
      store = TestBed.inject(IncidentStore);
      tick();

      expect(store.error()).toBe('El servidor no pudo procesar la solicitud.');
      expect(store.getAll().length).toBe(0);
      // Se da por inicializado igualmente: no está cargando, simplemente falló.
      expect(store.loaded()).toBe(true);
      expect(store.loading()).toBe(false);
    }));

    it('El error se puede descartar', fakeAsync(() => {
      failNextApiRequest();
      store = TestBed.inject(IncidentStore);
      tick();
      expect(store.error()).toBeTruthy();

      store.clearError();

      expect(store.error()).toBeNull();
    }));

    it('Una petición correcta posterior limpia el error', fakeAsync(() => {
      failNextApiRequest();
      store = TestBed.inject(IncidentStore);
      tick();
      expect(store.error()).toBeTruthy();

      store.load();
      tick();

      expect(store.error()).toBeNull();
      expect(store.getAll().length).toBe(MOCK_INCIDENTS.length);
    }));

    it('Apaga el indicador de carga aunque la petición falle', fakeAsync(() => {
      failNextApiRequest();
      store = TestBed.inject(IncidentStore);
      tick();

      expect(store.loading()).toBe(false);
    }));
  });

  describe('selección', () => {
    beforeEach(fakeAsync(() => start()));

    it('Arranca sin nada seleccionado', () => {
      expect(store.selectedId()).toBeNull();
      expect(store.selectedIncident()).toBeUndefined();
    });

    it('Selecciona por identificador', () => {
      store.select('inc-002');

      expect(store.selectedId()).toBe('inc-002');
      expect(store.selectedIncident()?.title).toBe(MOCK_INCIDENTS[1].title);
    });

    it('volver a seleccionar la misma la deselecciona', () => {
      store.select('inc-002');
      store.select('inc-002');

      expect(store.selectedId()).toBeNull();
    });

    it('Al eliminar la seleccionada, la selección se limpia', fakeAsync(() => {
      store.select('inc-002');

      store.remove('inc-002').subscribe();
      tick();

      expect(store.selectedId()).toBeNull();
    }));

    it('Eliminar otra no toca la selección', fakeAsync(() => {
      store.select('inc-002');

      store.remove('inc-001').subscribe();
      tick();

      expect(store.selectedId()).toBe('inc-002');
    }));
  });

  describe('filtros', () => {
    beforeEach(fakeAsync(() => start()));

    it('Arranca sin filtros activos', () => {
      expect(store.hasActiveFilters()).toBe(false);
      expect(store.visibleCount()).toBe(MOCK_INCIDENTS.length);
    });

    it('Cambia un filtro conservando los demás', () => {
      store.setFilters({ status: 'OPEN' });
      store.setFilters({ priority: 'HIGH' });

      expect(store.filters()).toEqual({
        search: '',
        status: 'OPEN',
        priority: 'HIGH',
        category: '',
      });
    });

    it('Filtra la lista visible sin tocar la colección', () => {
      store.setFilters({ priority: 'CRITICAL' });

      const critical = MOCK_INCIDENTS.filter((i) => i.priority === 'CRITICAL').length;
      expect(store.visibleCount()).toBe(critical);
      // Los indicadores siguen contando sobre el total.
      expect(store.totalCount()).toBe(MOCK_INCIDENTS.length);
    });

    it('Los limpia todos de una vez', () => {
      store.setFilters({ search: 'red', status: 'OPEN', priority: 'HIGH' });

      store.clearFilters();

      expect(store.hasActiveFilters()).toBe(false);
      expect(store.visibleCount()).toBe(MOCK_INCIDENTS.length);
    });
  });

  describe('Filtro por categoría', () => {
    beforeEach(fakeAsync(() => start()));

    it('Deriva las categorías de las propias incidencias, sin repetir y ordenadas', () => {
      const expected = [...new Set(MOCK_INCIDENTS.map((i) => i.category))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      );

      expect(store.categories()).toEqual(expected);
    });

    it('Filtra por categoría', () => {
      store.setFilters({ category: 'Hardware' });

      expect(store.visibleCount()).toBe(
        MOCK_INCIDENTS.filter((i) => i.category === 'Hardware').length,
      );
    });

    it('Una categoría nueva aparece sola al registrarla', fakeAsync(() => {
      store
        .create({
          title: 'Ruido en el aire acondicionado',
          description: 'Se oye desde toda la planta.',
          category: 'Climatización',
          priority: 'LOW',
          reporterId: 'u-005',
        })
        .subscribe();
      tick();

      expect(store.categories()).toContain('Climatización');
    }));
  });

  describe('Ordenamiento', () => {
    beforeEach(fakeAsync(() => start()));

    it('Por defecto muestra lo más reciente primero', () => {
      const dates = store.visibleIncidents().map((i) => Date.parse(i.createdAt));

      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('Ordena por fecha ascendente', () => {
      store.setSort({ field: 'createdAt', direction: 'asc' });

      const dates = store.visibleIncidents().map((i) => Date.parse(i.createdAt));
      expect(dates).toEqual([...dates].sort((a, b) => a - b));
    });

    it('Ordena por prioridad de mayor a menor gravedad, no alfabéticamente', () => {
      store.setSort({ field: 'priority', direction: 'desc' });

      // Alfabéticamente CRITICAL iría antes que HIGH, pero LOW antes que
      // MEDIUM: lo que se comprueba es el orden de gravedad.
      const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const ranks = store.visibleIncidents().map((i) => rank[i.priority]);

      expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
      expect(store.visibleIncidents()[0].priority).toBe('CRITICAL');
    });

    it('ToggleSort invierte la dirección si ya se ordena por ese campo', () => {
      store.setSort({ field: 'priority', direction: 'desc' });

      store.toggleSort('priority');

      expect(store.sort()).toEqual({ field: 'priority', direction: 'asc' });
    });

    it('ToggleSort con otro campo empieza descendente', () => {
      store.setSort({ field: 'priority', direction: 'asc' });

      store.toggleSort('createdAt');

      expect(store.sort()).toEqual({ field: 'createdAt', direction: 'desc' });
    });

    it('No muta la colección al ordenar', () => {
      const before = store.getAll().map((i) => i.id);

      store.setSort({ field: 'priority', direction: 'asc' });
      store.visibleIncidents();

      expect(store.getAll().map((i) => i.id)).toEqual(before);
    });
  });

  describe('Paginación', () => {
    beforeEach(fakeAsync(() => start()));

    it('Reparte los resultados en páginas del tamaño configurado', () => {
      expect(store.pageSize()).toBe(4);
      expect(store.pagedIncidents().length).toBe(4);
      expect(store.totalPages()).toBe(2); // 5 incidencias en páginas de 4
    });

    it('Na página siguiente muestra el resto', () => {
      store.nextPage();

      expect(store.currentPageNumber()).toBe(2);
      expect(store.pagedIncidents().length).toBe(MOCK_INCIDENTS.length - 4);
    });

    it('No se puede pasar de la última página ni bajar de la primera', () => {
      store.goToPage(99);
      expect(store.currentPageNumber()).toBe(store.totalPages());
      expect(store.hasNextPage()).toBe(false);

      store.goToPage(-5);
      expect(store.currentPageNumber()).toBe(1);
      expect(store.hasPreviousPage()).toBe(false);
    });

    it('Ninguna incidencia se repite ni se pierde entre páginas', () => {
      const first = store.pagedIncidents().map((i) => i.id);
      store.nextPage();
      const second = store.pagedIncidents().map((i) => i.id);

      const all = [...first, ...second];
      expect(new Set(all).size).toBe(MOCK_INCIDENTS.length);
    });

    it('Cambiar un filtro vuelve a la primera página', () => {
      store.nextPage();
      expect(store.currentPageNumber()).toBe(2);

      store.setFilters({ status: 'OPEN' });

      expect(store.currentPageNumber()).toBe(1);
    });

    it('Ordenar también vuelve a la primera página', () => {
      store.nextPage();

      store.setSort({ field: 'priority', direction: 'asc' });

      expect(store.currentPageNumber()).toBe(1);
    });

    it('Si un filtro deja menos páginas, la actual se recorta sola', () => {
      store.nextPage();
      // Se filtra a un solo resultado: la página 2 deja de existir.
      store.setFilters({ priority: 'CRITICAL' });

      expect(store.totalPages()).toBe(1);
      expect(store.currentPageNumber()).toBe(1);
    });

    it('Con un tamaño mayor cabe todo en una página', () => {
      store.setPageSize(12);

      expect(store.totalPages()).toBe(1);
      expect(store.pagedIncidents().length).toBe(MOCK_INCIDENTS.length);
    });

    it('Informa del rango mostrado', () => {
      expect(store.pageRange()).toEqual({ from: 1, to: 4 });

      store.nextPage();

      expect(store.pageRange()).toEqual({ from: 5, to: 5 });
    });

    it('Sin resultados, el rango es cero y sigue habiendo una página', () => {
      store.setFilters({ category: 'No existe esta categoría' });

      expect(store.visibleCount()).toBe(0);
      expect(store.pageRange()).toEqual({ from: 0, to: 0 });
      expect(store.totalPages()).toBe(1);
    });
  });

  describe('encapsulación del estado', () => {
    beforeEach(fakeAsync(() => start()));

    const readOnlySignals = [
      'incidents',
      'filters',
      'error',
      'loaded',
      'selectedId',
    ] as const;

    for (const name of readOnlySignals) {
      it(`la señal "${name}" no se puede escribir desde fuera`, () => {
        const exposed = store[name] as unknown as Record<string, unknown>;

        expect('set' in exposed).toBe(false);
        expect('update' in exposed).toBe(false);
      });
    }

    it('Los selectores derivados tampoco', () => {
      for (const selector of [store.totalCount, store.visibleIncidents, store.selectedIncident]) {
        expect('set' in selector).toBe(false);
      }
    });

    it('Modificar lo que devuelve getAll no altera el estado', () => {
      (store.getAll() as Incident[]).length = 0;

      expect(store.totalCount()).toBe(MOCK_INCIDENTS.length);
    });
  });

  describe('Reactividad', () => {
    beforeEach(fakeAsync(() => start()));

    it('La señal expuesta es de solo lectura', () => {
      expect('set' in store.incidents).toBe(false);
      expect('update' in store.incidents).toBe(false);
    });

    it('No muta los datos simulados originales', fakeAsync(() => {
      const snapshot = MOCK_INCIDENTS.map((incident) => ({ ...incident }));

      store.create(DRAFT).subscribe();
      tick();
      store.remove('inc-001').subscribe();
      tick();

      expect(MOCK_INCIDENTS).toEqual(snapshot);
    }));
  });
});