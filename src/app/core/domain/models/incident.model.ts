export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

//Usabamos type union, pero el reto pide crearlo con emums
//Los usamos porque nos permiten tener un conjunto de valores predefinidos y nos ayudan a evitar errores de tipeo al trabajar con estados y prioridades de incidentes. Además, los enums proporcionan una mejor legibilidad y mantenibilidad del código, ya que podemos referirnos a los valores por nombre en lugar de cadenas literales.
export enum IncidentStatusEnum {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IncidentPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Incident {
  readonly id: string;
  title: string;
  description: string;
  category: string;
  priority: IncidentPriorityEnum;
  status: IncidentStatusEnum;
  reporterId: string;
  assignedAgentId?: string;
  tags?: readonly string[];
  createdAt: string;
  updatedAt: string;
}

// El tipo IncidentDraft representa un borrador de una incidencia que aún no ha sido creada en el sistema. Contiene todos los campos necesarios para crear una nueva incidencia, excepto el id, el estado, la fecha de creación y la fecha de actualización, que serán generados automáticamente por el sistema al crear la incidencia. Además, el campo status es opcional, lo que permite que se pueda crear un borrador sin especificar un estado inicial.
export type IncidentDraft = Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
  readonly status?: IncidentStatusEnum;
};

// El tipo IncidentSearchCriteria representa los criterios de búsqueda que se pueden utilizar para filtrar la lista de incidencias. Contiene campos opcionales para el término de búsqueda, el estado, la prioridad y la categoría de las incidencias. Si un campo es undefined, significa que no se está aplicando ningún filtro para ese criterio.
export type IncidentChanges = Partial<Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>>;

/** Estado con el que nace toda incidencia. */
export const INITIAL_STATUS: IncidentStatusEnum = IncidentStatusEnum.OPEN;

/**
 * Siguiente identificador de la serie: `inc-001`, `inc-002`, …
 *
 * Es una función pura sobre las incidencias existentes: mismo listado, mismo
 * resultado. Estaba dentro del store, que es una clase de Angular; aquí se
 * puede probar sin montar nada.
 *
 * > Con un servidor real esto **no debería existir**: quien asigna
 * > identificadores es quien guarda, porque es el único que puede garantizar
 * > que no se repitan. Está aquí porque el backend simulado no lo hace.
 */
export function nextIncidentId(incidents: readonly Incident[]): string {
  const highest = incidents.reduce((max, incident) => {
    const value = Number.parseInt(incident.id.replace(/\D/g, ''), 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 0);

  return `inc-${String(highest + 1).padStart(3, '0')}`;

  
}

export const STATUS_TRANSITIONS: Readonly<Record<IncidentStatusEnum, readonly IncidentStatusEnum[]>> = {
  [IncidentStatusEnum.OPEN]: [IncidentStatusEnum.IN_PROGRESS, IncidentStatusEnum.CLOSED],
  [IncidentStatusEnum.IN_PROGRESS]: [IncidentStatusEnum.RESOLVED, IncidentStatusEnum.OPEN],
  [IncidentStatusEnum.RESOLVED]: [IncidentStatusEnum.CLOSED, IncidentStatusEnum.IN_PROGRESS],
  [IncidentStatusEnum.CLOSED]: [IncidentStatusEnum.OPEN],
};

export function nextStatuses(from: IncidentStatusEnum): readonly IncidentStatusEnum[] {
  return STATUS_TRANSITIONS[from];
}

export function canTransitionTo(from: IncidentStatusEnum, to: IncidentStatusEnum): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function commonNextStatuses(
  incidents: readonly Incident[],
): readonly IncidentStatusEnum[] {
  if (incidents.length === 0) {
    return [];
  }

  const [primera, ...resto] = incidents;

  return nextStatuses(primera.status).filter((destino) =>
    resto.every((incident) => canTransitionTo(incident.status, destino)),
  );
}