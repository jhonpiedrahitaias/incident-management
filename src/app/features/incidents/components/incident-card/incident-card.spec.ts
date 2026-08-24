import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentCard } from './incident-card';
import { Incident, IncidentPriorityEnum, IncidentStatusEnum } from '../../../../core/models/incident.model';

const INCIDENT: Incident = {
  id: 'inc-001',
  title: 'No se puede iniciar sesión',
  description: 'El usuario recibe un error 500 al intentar autenticarse.',
  category: 'Autenticación',
  priority: IncidentPriorityEnum.HIGH,
  status: IncidentStatusEnum.OPEN,
  reporterId: 'u-004',
  createdAt: '2026-07-27T09:15:00.000Z',
  updatedAt: '2026-07-27T09:15:00.000Z',
};

describe('IncidentCard', () => {
  let component: IncidentCard;
  let fixture: ComponentFixture<IncidentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentCard],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentCard);
    component = fixture.componentInstance;
    // El input es requerido: hay que asignarlo antes del primer ciclo de detección.
    fixture.componentRef.setInput('incident', INCIDENT);
    fixture.detectChanges();
  });

  it('Debería crear', () => {
    expect(component).toBeTruthy();
  });

  it('Emite la incidencia recibida al seleccionar', () => {
    let emitted: Incident | undefined;
    component.incidentSelected.subscribe((incident) => (emitted = incident));

    clickButton('Seleccionar');

    expect(emitted).toBe(INCIDENT);
  });

  it('Emite la incidencia recibida al pedir eliminarla, sin modificarla', () => {
    let emitted: Incident | undefined;
    component.deleteRequested.subscribe((incident) => (emitted = incident));

    clickButton('Eliminar incidencia');

    expect(emitted).toBe(INCIDENT);
    expect(component.incident()).toEqual(INCIDENT);
  });

  function accessibleName(element: HTMLElement): string {
    return element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '';
  }

  function findButton(label: string): HTMLButtonElement {
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const button = buttons.find((candidate) => accessibleName(candidate).startsWith(label));

    if (!button) {
      throw new Error(`No se encontró el botón "${label}"`);
    }

    return button;
  }

  function clickButton(label: string): void {
    findButton(label).click();
    fixture.detectChanges();
  }
});