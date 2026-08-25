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