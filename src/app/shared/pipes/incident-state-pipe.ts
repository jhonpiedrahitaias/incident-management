import { Pipe, PipeTransform } from '@angular/core';
import { IncidentStatusEnum } from '../../core/domain/models/incident.model';

const STATE_LABELS: Readonly<Record<IncidentStatusEnum, string>> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
};

const UNKNOWN_LABEL = 'Desconocido';

@Pipe({
  name: 'incidentState',
})
export class IncidentStatePipe implements PipeTransform {

  transform(
    value: IncidentStatusEnum | string | null | undefined
  ): string {
    if (value === null || value === undefined) {
      return UNKNOWN_LABEL;
    }

    return STATE_LABELS[value as IncidentStatusEnum] ?? UNKNOWN_LABEL;
  }
}