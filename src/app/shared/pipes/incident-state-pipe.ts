import { pipe } from "rxjs";
import { IncidentStatus } from "../../core/models/incident.model";
import { Pipe } from "@angular/core";

const STATE_LABELS: Readonly<Record<IncidentStatus, string>> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
};

const UNKNOWN_LABEL = 'Desconocido';

@Pipe({
  name: 'incidentState',
})

export class IncidentStatePipe {
  transform(value: IncidentStatus | string | null | undefined): string {
    if (value === null || value === undefined) {
      return UNKNOWN_LABEL;
    }
    return STATE_LABELS[value as IncidentStatus] ?? UNKNOWN_LABEL;
    }
}

