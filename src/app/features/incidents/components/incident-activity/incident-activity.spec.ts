import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentActivity } from './incident-activity';
import { Incident, IncidentPriorityEnum, IncidentStatusEnum } from '../../../../core/domain/models/incident.model';
import { prepareApi, provideTestApi } from '../../../../testing/api-testing';

/**
 * Fecha relativa al momento de ejecutar, no fija.
 *
 * Con una fecha escrita a mano esta prueba era una bomba de tiempo: se
 * escribió cuando «hace unos días» era cierto, y empezó a fallar sola al
 * pasar el mes, porque el pipe de tiempo relativo dijo «el mes pasado». El
 * código nunca estuvo mal; el que caducaba era el dato.
 */
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

const REPORTED: Incident = {
  id: 'inc-001',
  title: 'No se puede iniciar sesión',
  description: 'Error 500 al autenticarse.',
  category: 'Autenticación',
  priority: IncidentPriorityEnum.HIGH,
  status: IncidentStatusEnum.OPEN,
  reporterId: 'u-004',
  createdAt: THREE_DAYS_AGO,
  updatedAt: THREE_DAYS_AGO,
};

describe('IncidentActivity', () => {
  let component: IncidentActivity;
  let fixture: ComponentFixture<IncidentActivity>;

  beforeEach(async () => {
    prepareApi();
    await TestBed.configureTestingModule({
      imports: [IncidentActivity],
      providers: [provideTestApi()],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentActivity);
    component = fixture.componentInstance;
    // El input es requerido: se asigna antes del primer ciclo.
    fixture.componentRef.setInput('incident', REPORTED);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('siempre incluye el registro de la incidencia', () => {
    expect(entries().length).toBe(1);
    expect(text()).toContain('Incidencia registrada');
  });

  it('resuelve el identificador de quien la reportó a su nombre', () => {
    expect(text()).toContain('Carlos Peña');
  });

  it('añade la asignación cuando hay agente', () => {
    setIncident({ ...REPORTED, assignedAgentId: 'u-002' });

    expect(text()).toContain('Asignada a un agente');
    expect(text()).toContain('Luis Gómez');
  });

  it('no muestra «última actualización» si nunca se modificó', () => {
    // createdAt y updatedAt iguales: no hubo cambio que contar.
    expect(text()).not.toContain('Última actualización');
  });

  it('la muestra cuando sí hubo un cambio', () => {
    setIncident({ ...REPORTED, updatedAt: '2026-07-28T10:00:00.000Z' });

    expect(text()).toContain('Última actualización');
  });

  it('usa una lista ordenada: el orden de los hechos importa', () => {
    expect(fixture.nativeElement.querySelector('ol')).toBeTruthy();
  });

  it('cada fecha es legible por máquinas y por personas', () => {
    const time: HTMLTimeElement = fixture.nativeElement.querySelector('time');

    expect(time.getAttribute('datetime')).toBe(REPORTED.createdAt);
    expect(time.textContent?.trim()).toContain('hace');
  });

  function setIncident(incident: Incident): void {
    fixture.componentRef.setInput('incident', incident);
    fixture.detectChanges();
  }

  function entries(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.activity-entry'));
  }

  function text(): string {
    return fixture.nativeElement.textContent ?? '';
  }
});