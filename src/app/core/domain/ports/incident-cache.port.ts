import { Incident } from '../models/incident.model';

/**
 * Puerto del **modelo de lectura** que la aplicación mantiene en memoria.
 *
 * ## Por qué existe
 *
 * Sin él, mover los comandos a los casos de uso rompería la aplicación. El
 * flujo real es: se registra una incidencia y se navega a su detalle, que la
 * busca en la colección que ya está cargada. Si el caso de uso solo guardara
 * en el repositorio, esa colección se quedaría vieja y el detalle aparecería
 * en blanco.
 *
 * Así que un caso de uso de escritura tiene **dos** obligaciones: persistir y
 * dejar coherente lo que la pantalla está leyendo. Este puerto es la segunda.
 *
 * ## Por qué es un puerto y no una llamada al store
 *
 * Porque el store es Angular —`@Injectable`, señales— y un caso de uso no
 * puede importarlo. El caso de uso declara *qué* necesita («avísame de que
 * esta incidencia ya existe»); quién lo implementa y con qué tecnología es
 * problema de la infraestructura.
 *
 * Hoy lo cumple `IncidentStore`. Si mañana el estado se llevara a NgRx o a un
 * `BehaviorSubject`, los casos de uso no se enterarían.
 *
 * Sin dependencias de Angular: es una interfaz de dominio.
 */
export interface IncidentCache {
  // No declara «eliminar»: hoy ningún caso de uso borra. El puerto describe
  // lo que la aplicación necesita, no todo lo que se podría hacer — igual
  // que `UserRepository`, que solo declara obtener.

  /** Sustituye la colección entera. Lo usa la consulta. */
  setAll(incidents: readonly Incident[]): void;

  /** Incorpora una incidencia recién registrada. */
  add(incident: Incident): void;

  /** Sustituye una existente por su versión nueva. */
  replace(incident: Incident): void;

  /**
   * Lo que hay ahora mismo.
   *
   * Hace falta para calcular el siguiente identificador, que depende de los
   * ya usados. Es de solo lectura: quien la recibe no debe modificarla.
   */
  snapshot(): readonly Incident[];
}