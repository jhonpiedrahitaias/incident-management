import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { Incident } from '../../domain/models/incident.model';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';
import { MOCK_INCIDENTS } from '../mocks/incidents.mock';

/** Clave del navegador. Con prefijo para no chocar con otras aplicaciones. */
const CLAVE = 'incident-management.incidents';

/**
 * Adaptador de `IncidentRepository` sobre `localStorage`.
 *
 * Es la demostración de para qué servían los puertos: esta clase es lo
 * **único** que se escribió para cambiar de HTTP a almacenamiento local. El
 * store, los casos de uso y el dominio no se enteran, y lo único que hubo que
 * tocar fuera de aquí es una línea de `app.config.ts`.
 *
 * ## Síncrono por dentro, `Observable` por fuera
 *
 * `localStorage` responde al instante, pero el puerto promete `Observable`.
 * Se envuelve con `of(...)`: así el contrato no cambia y volver a HTTP —o
 * pasar a IndexedDB, que sí es asíncrono— no toca a nadie más.
 *
 * ## Lo que este adaptador **no** hace
 *
 * No traduce errores como hace `errorHandlingInterceptor`, porque no pasa por
 * la cadena HTTP: aquí no hay red que falle. Emite `Error` corrientes con un
 * mensaje legible, que es lo que el store y las pantallas esperan leer.
 *
 * Y no lleva identificador de correlación: no hay servidor al que rastrear.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageIncidentRepository implements IncidentRepository {
  // --- Obtener ---------------------------------------------------------------

  getAll(): Observable<Incident[]> {
    return of(this.leer());
  }

  search(term: string): Observable<Incident[]> {
    const buscado = term.trim().toLowerCase();

    if (!buscado) {
      return this.getAll();
    }

    // Mismo criterio que usaba el servidor simulado —título y descripción—
    // para que cambiar de adaptador no cambie lo que encuentra el usuario.
    return of(
      this.leer().filter(
        (incident) =>
          incident.title.toLowerCase().includes(buscado) ||
          incident.description.toLowerCase().includes(buscado),
      ),
    );
  }

  getById(id: string): Observable<Incident> {
    const encontrada = this.leer().find((incident) => incident.id === id);

    return encontrada
      ? of(encontrada)
      : throwError(() => new Error(`No existe la incidencia ${id}.`));
  }

  // --- Guardar ---------------------------------------------------------------

  create(incident: Incident): Observable<Incident> {
    this.escribir([...this.leer(), incident]);
    return of(incident);
  }

  // --- Actualizar ------------------------------------------------------------

  update(incident: Incident): Observable<Incident> {
    const actuales = this.leer();
    const posicion = actuales.findIndex((candidata) => candidata.id === incident.id);

    if (posicion === -1) {
      // Guardarla igualmente la crearía de la nada, que no es actualizar.
      return throwError(() => new Error(`No existe la incidencia ${incident.id}.`));
    }

    this.escribir(actuales.map((candidata) => (candidata.id === incident.id ? incident : candidata)));
    return of(incident);
  }

  // --- Eliminar --------------------------------------------------------------

  remove(id: string): Observable<void> {
    const actuales = this.leer();

    if (!actuales.some((incident) => incident.id === id)) {
      return throwError(() => new Error(`No existe la incidencia ${id}.`));
    }

    this.escribir(actuales.filter((incident) => incident.id !== id));
    return of(void 0);
  }

  // --- Interno ---------------------------------------------------------------

  private leer(): Incident[] {
    const crudo = this.almacen?.getItem(CLAVE);

    // Primera visita: se siembra el juego de demostración. Sin esto la
    // aplicación abriría vacía y no habría nada que enseñar. Para volver al
    // estado inicial basta con borrar la clave desde las herramientas del
    // navegador.
    if (crudo === null || crudo === undefined) {
      const iniciales = MOCK_INCIDENTS.map((incident) => ({ ...incident }));
      this.escribir(iniciales);
      return iniciales;
    }

    try {
      const datos: unknown = JSON.parse(crudo);

      // `JSON.parse` devuelve `any`, y lo que hay en el disco lo pudo
      // escribir otra versión de la aplicación o alguien desde la consola.
      // Si no es una lista se descarta, en vez de arrastrar el problema.
      return Array.isArray(datos) ? (datos as Incident[]) : [];
    } catch {
      return [];
    }
  }

  private escribir(incidencias: readonly Incident[]): void {
    try {
      this.almacen?.setItem(CLAVE, JSON.stringify(incidencias));
    } catch {
      // `localStorage` lanza si se llena la cuota o si el navegador lo
      // prohíbe. Se ignora a propósito: mejor seguir funcionando en memoria
      // que romper la pantalla al guardar.
    }
  }

  /**
   * `localStorage` puede no existir: renderizado en servidor, o un navegador
   * con el almacenamiento bloqueado. Se degrada a no persistir nada.
   */
  private get almacen(): Storage | null {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }
}