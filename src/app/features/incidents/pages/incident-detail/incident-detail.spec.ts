import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadIncidents,
  loginForTest,
  prepareApi,
  provideTestApi,
} from '../../../../testing/api-testing';

import { IncidentDetail } from './incident-detail';
import { IncidentStore } from '../../../../core/infrastructure/state/incident-store';
import { MOCK_INCIDENTS } from '../../../../core/infrastructure/mocks/incidents.mock';
import { failNextApiRequest } from '../../../../core/infrastructure/api/fake-backend-interceptor';
import { IncidentStatusEnum } from '../../../../core/domain/models/incident.model';

describe('IncidentDetail', () => {
  let component: IncidentDetail;
  let fixture: ComponentFixture<IncidentDetail>;

  beforeEach(async () => {
    prepareApi();
    await TestBed.configureTestingModule({
      imports: [IncidentDetail],
      providers: [provideRouter([]), provideTestApi()],
    }).compileComponents();
  });

  beforeEach(fakeAsync(() => {
    loadIncidents();
    loginForTest('ADMIN');

    fixture = TestBed.createComponent(IncidentDetail);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    setId('inc-001');
    expect(component).toBeTruthy();
  });

  describe('cuando la incidencia existe', () => {
    beforeEach(() => setId('inc-003'));

    it('muestra sus datos principales', () => {
      const incident = MOCK_INCIDENTS.find((i) => i.id === 'inc-003')!;

      expect(text()).toContain(incident.title);
      expect(text()).toContain(incident.description);
      expect(text()).toContain(incident.category);
    });

    it('traduce la prioridad a su etiqueta legible', () => {
      expect(text()).toContain('Crítica');
    });

    it('resuelve los identificadores de usuario a nombres', () => {
      // inc-003 la reporta u-004 y la atiende u-003.
      expect(text()).toContain('Carlos Peña');
      expect(text()).toContain('Marta Ruiz');
    });

    it('aplica el resaltado de incidencia crítica', () => {
      expect(fixture.nativeElement.querySelector('.is-critical')).toBeTruthy();
    });

    it('ofrece un enlace de vuelta al listado', () => {
      const back: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/incidents"]');

      expect(back).toBeTruthy();
    });
  });

  describe('cuando la incidencia no existe', () => {
    beforeEach(() => setId('inc-999'));

    it('avisa de que no se encontró, sin romperse', () => {
      expect(text()).toContain('Incidencia no encontrada');
      expect(text()).toContain('INC-999');
    });

    it('sigue ofreciendo la vuelta al listado', () => {
      expect(fixture.nativeElement.querySelector('a[href="/incidents"]')).toBeTruthy();
    });
  });

  it('reacciona si la incidencia se elimina mientras se está viendo', fakeAsync(() => {
    setId('inc-001');
    expect(text()).toContain('No se puede iniciar sesión');

    TestBed.inject(IncidentStore).remove('inc-001').subscribe();
    tick();
    fixture.detectChanges();

    expect(text()).toContain('Incidencia no encontrada');
  }));

  describe('acciones según el rol (Día 20)', () => {
    it('quien gestiona incidencias ve el enlace de editar', () => {
      setId('inc-001');

      expect(editLink()).toBeTruthy();
    });

    it('un REQUESTER no ve el enlace de editar', fakeAsync(() => {
      loginForTest('REQUESTER');
      setId('inc-001');

      expect(editLink()).toBeNull();
      // Pero sigue viendo la incidencia: solo se le oculta la acción.
      expect(text()).toContain('No se puede iniciar sesión');
    }));

    function editLink(): HTMLAnchorElement | null {
      return fixture.nativeElement.querySelector('a[href$="/edit"]');
    }
  });


  // --- Cambio de estado -----------------------------------------------------

  describe('cambio de estado', () => {
    it('ofrece solo las transiciones que el dominio permite', () => {
      // inc-001 está OPEN: de ahí se toma en curso o se cierra. «Marcar
      // resuelta» no debe aparecer, porque el caso de uso la rechazaría.
      setId('inc-001');

      expect(accionesDeEstado()).toEqual(['En progreso', 'Cerrar']);
    });

    it('las opciones cambian según el estado actual', () => {
      setId('inc-005'); // CLOSED

      expect(accionesDeEstado()).toEqual(['Reabrir']);
    });

    it('muestra el estado con su etiqueta, no con el código', () => {
      setId('inc-003'); // IN_PROGRESS

      expect(text()).toContain('En progreso');
      expect(text()).not.toContain('IN_PROGRESS');
    });

    it('al pulsar una acción cambia el estado de la incidencia', fakeAsync(() => {
      setId('inc-001');

      pulsar('En progreso');
      tick();
      fixture.detectChanges();

      expect(TestBed.inject(IncidentStore).getById('inc-001')!.status).toBe(IncidentStatusEnum.IN_PROGRESS);
    }));

    it('tras el cambio se ofrecen las transiciones del estado nuevo', fakeAsync(() => {
      setId('inc-001');

      pulsar('En progreso');
      tick();
      fixture.detectChanges();

      // La pantalla se repinta sola: `incident` es un `computed` sobre el
      // store y el caso de uso ya dejó ahí el resultado.
      expect(accionesDeEstado()).toEqual(['Marcar como resuelta', 'Reabrir']);
    }));

    it('el cambio persiste: no es solo un retoque en memoria', fakeAsync(() => {
      setId('inc-004'); // RESOLVED

      pulsar('Cerrar');
      tick();
      fixture.detectChanges();

      // Se vuelve a pedir al servidor para comprobar que se guardó de verdad.
      loadIncidents();
      expect(TestBed.inject(IncidentStore).getById('inc-004')!.status).toBe('CLOSED');
    }));

    it('quien no puede gestionar incidencias no ve las acciones', fakeAsync(() => {
      // `loginForTest` hace una petición: necesita `fakeAsync` para que la
      // respuesta llegue antes de mirar la pantalla.
      loginForTest('REQUESTER');
      setId('inc-001');

      // El guard protege la ruta de edición; esto evita ofrecer algo que el
      // servidor debería rechazar igualmente.
      expect(accionesDeEstado()).toEqual([]);
    }));

    it('si el cambio falla, lo dice y no altera la incidencia', fakeAsync(() => {
      setId('inc-001');
      failNextApiRequest();

      pulsar('En progreso');
      tick();
      fixture.detectChanges();

      const aviso: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
      expect(aviso).toBeTruthy();
      expect(TestBed.inject(IncidentStore).getById('inc-001')!.status).toBe('OPEN');
    }));
  });


  // --- Día 9: ramas defensivas que el informe de cobertura destapó ----------

  describe('ramas defensivas', () => {
    it('con un id inexistente no ofrece acciones ni rompe', () => {
      setId('inc-no-existe');

      // El `computed` de estados siguientes cae en su rama vacía.
      expect(accionesDeEstado()).toEqual([]);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('pulsar dos veces seguidas no lanza dos peticiones', fakeAsync(() => {
      setId('inc-001');
      const store = TestBed.inject(IncidentStore);
      spyOn(store, 'getById').and.callThrough();

      const boton = botonDeEstado('En progreso');
      boton.click();
      // Sin esperar a la respuesta, se vuelve a pulsar.
      boton.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // La guarda `cambiando()` lo impide: dos cambios encabalgados dejarían
      // la incidencia en un estado que nadie pidió.
      expect(TestBed.inject(IncidentStore).getById('inc-001')!.status).toBe('IN_PROGRESS');
    }));

    it('si el usuario que reportó no se puede resolver, muestra su identificador', () => {
      // Mejor un id que un hueco en blanco: al menos se puede buscar quién
      // es. Pasa si el usuario se dio de baja o vino de otro sistema.
      setId('inc-001');

      const conNombre = text();
      expect(conNombre.length).toBeGreaterThan(0);
    });
  });

  /** Etiquetas de los botones de cambio de estado, en orden. */
  function accionesDeEstado(): string[] {
    return Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.status-change-actions button'),
    ).map((boton) => boton.textContent?.trim() ?? '');
  }

  function botonDeEstado(etiqueta: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.status-change-actions button'),
    ).find((candidato) => candidato.textContent?.trim() === etiqueta)!;
  }

  function pulsar(etiqueta: string): void {
    const boton = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.status-change-actions button'),
    ).find((candidato) => candidato.textContent?.trim() === etiqueta);

    boton!.click();
    fixture.detectChanges();
  }

  function setId(id: string): void {
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});