import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { loadIncidents, prepareApi, provideTestApi } from '../../../../testing/api-testing';
import { IncidentApi } from '../../../../core/infrastructure/api/incident-api';

/** Debe coincidir con el debounce del componente. */
const SEARCH_DEBOUNCE_MS = 300;

import { IncidentList } from './incident-list';
import { MOCK_INCIDENTS } from '../../../../core/infrastructure/mocks/incidents.mock';
import { IncidentStore } from '../../../../core/infrastructure/state/incident-store';

/** Ancho de referencia del teléfono más estrecho que soportamos. */
const NARROW_VIEWPORT_PX = 320;

describe('IncidentList', () => {
  let fixture: ComponentFixture<IncidentList>;
  let component: IncidentList;
  let store: IncidentStore;
  let api: IncidentApi;

  beforeEach(async () => {
    prepareApi();
    await TestBed.configureTestingModule({
      imports: [IncidentList],
      // El listado y las tarjetas usan routerLink desde el Día 13.
      providers: [provideRouter([]), provideTestApi()],
    }).compileComponents();
  });

  beforeEach(fakeAsync(() => {
    // El servicio carga desde la API en su constructor: se deja llegar la
    // respuesta antes de renderizar.
    store = loadIncidents();
    api = TestBed.inject(IncidentApi);
    // El Día 22 introdujo paginación y orden por fecha. Las pruebas que no
    // van de eso se aíslan: caben todas las incidencias en una página.
    store.setPageSize(50);

    fixture = TestBed.createComponent(IncidentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  // Ningún diálogo puede quedar abierto entre pruebas: atraparía el foco.
  afterEach(() => {
    for (const element of Array.from(document.querySelectorAll('dialog'))) {
      (element as HTMLDialogElement).close();
    }
  });


  it('no muta la colección original al eliminar (inmutabilidad)', fakeAsync(() => {
    const snapshot = [...MOCK_INCIDENTS];

    deleteIncident(cardOf(MOCK_INCIDENTS[0]));

    expect(MOCK_INCIDENTS).toEqual(snapshot);
  }));



  // --- Día 17: suscripciones y ciclo de vida -------------------------------

  /** Activa o desactiva el refresco automático desde la casilla. */
  function toggleAutoRefresh(): void {
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('#auto-refresh');
    checkbox.click();
    fixture.detectChanges();
  }

  /** Escribe un término y espera a que llegue la respuesta del servidor. */
  function search(term: string): void {
    type_('#search-term', term);
    tick(SEARCH_DEBOUNCE_MS);
    tick();
    fixture.detectChanges();
  }

  /** Agota temporizadores pendientes para que fakeAsync no proteste. */
  function finish(): void {
    tick(SEARCH_DEBOUNCE_MS);
    tick();
  }

  function hint(): string {
    return fixture.nativeElement.querySelector('#search-hint')?.textContent ?? '';
  }

  function stat(label: string): string {
    const items = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.stats-item'));
    const item = items.find((candidate) =>
      candidate.querySelector('.stats-label')?.textContent?.trim() === label,
    );

    if (!item) {
      throw new Error(`No se encontró el indicador "${label}"`);
    }

    return item.querySelector('.stats-value')?.textContent?.trim() ?? '';
  }

  function counter(): string {
    return fixture.nativeElement.querySelector('.incident-list-count')?.textContent ?? '';
  }

  function input(selector: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function type_(selector: string, value: string): void {
    const field = input(selector);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function select(selector: string, value: string): void {
    const field: HTMLSelectElement = fixture.nativeElement.querySelector(selector);
    field.value = value;
    field.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  // --- Día 22: paginación, orden y sincronización con la URL ---------------

  /**
   * Elimina una incidencia recorriendo el flujo real: pedirlo en la tarjeta
   * y confirmarlo en el diálogo (Día 23).
   */
  function deleteIncident(card: HTMLElement): void {
    findIn(card, 'Eliminar incidencia').click();
    fixture.detectChanges();

    // La confirmación se busca **dentro del diálogo**: en la página hay
    // otros botones cuyo nombre empieza por «Eliminar» (los de cada
    // tarjeta), y buscarlos por prefijo en todo el documento devolvía el de
    // la tarjeta, así que nunca se confirmaba nada.
    // `dialog[open]`, no `dialog`: desde que hay borrado en lote la página
    // monta dos diálogos, y coger el primero apuntaba al equivocado — la
    // confirmación no llegaba y el bucle de «eliminar todas» no terminaba.
    const dialog: HTMLElement = fixture.nativeElement.querySelector('dialog[open]');
    findIn(dialog, 'Eliminar').click();
    tick();
    fixture.detectChanges();
  }

  /** Tarjeta de una incidencia concreta, sin depender del orden. */
  function cardOf(incident: { title: string }): HTMLElement {
    const card = cards().find((candidate) => candidate.textContent?.includes(incident.title));

    if (!card) {
      throw new Error(`No se encontró la tarjeta de "${incident.title}"`);
    }

    return card;
  }

  function cards(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-incident-card'));
  }

  function text(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  /**
   * Nombre accesible por orden de prioridad: `aria-label`, después la
   * `<label for>` asociada (que es de donde lo toman `input` y `select`) y,
   * por último, el texto del propio elemento.
   */
  function accessibleName(element: HTMLElement): string {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    if (element.id) {
      const label = fixture.nativeElement.querySelector(`label[for="${element.id}"]`);
      if (label?.textContent?.trim()) {
        return label.textContent.trim();
      }
    }

    return element.textContent?.trim() ?? '';
  }

  function findIn(root: ParentNode, label: string): HTMLButtonElement {
    const buttons = Array.from<HTMLButtonElement>(root.querySelectorAll('button'));
    const button = buttons.find((candidate) => accessibleName(candidate).startsWith(label));

    if (!button) {
      throw new Error(`No se encontró el botón "${label}"`);
    }

    return button;
  }



  /** Marca la casilla de selección de una tarjeta. */
  function marcar(card: HTMLElement): void {
    const casilla: HTMLInputElement = card.querySelector(
      '.incident-card-select input[type="checkbox"]',
    )!;
    casilla.click();
    tick();
    fixture.detectChanges();
  }

  function clickIn(root: ParentNode, label: string): void {
    findIn(root, label).click();
    // Las acciones que llaman a la API resuelven en el siguiente turno.
    tick();
    fixture.detectChanges();
  }
});