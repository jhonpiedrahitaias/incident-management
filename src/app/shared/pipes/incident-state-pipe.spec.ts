import { IncidentStatusEnum } from "../../core/domain/models/incident.model";
import { IncidentStatePipe } from "./incident-state-pipe";


/**
 * Pruebas del pipe de estados. Sin `TestBed`: un pipe es una clase con un
 * método, y probarlo montando un componente solo añade lentitud.
 */
describe('IncidentStatePipe', () => {
  const pipe = new IncidentStatePipe();

  it('traduce cada estado del dominio', () => {
    expect(pipe.transform(IncidentStatusEnum.OPEN)).toBe('Abierto');
    expect(pipe.transform(IncidentStatusEnum.IN_PROGRESS)).toBe('En progreso');
    expect(pipe.transform(IncidentStatusEnum.RESOLVED)).toBe('Resuelta');
    expect(pipe.transform(IncidentStatusEnum.CLOSED)).toBe('Cerrada');
  });

  it('con nulo o indefinido no rompe la pantalla', () => {
    // Una incidencia a medio cargar no debe dejar la fila en blanco ni
    // reventar el renderizado.
    expect(pipe.transform(null)).toBe('Desconocido');
    expect(pipe.transform(undefined)).toBe('Desconocido');
  });

  it('la cadena vacía también', () => {
    expect(pipe.transform('')).toBe('Desconocido');
  });
});