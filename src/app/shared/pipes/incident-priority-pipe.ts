import { Pipe, PipeTransform } from '@angular/core';
import { IncidentPriority, IncidentPriorityEnum } from '../../core/models/incident.model';

const PRIORITY_LABELS: Readonly<Record<IncidentPriorityEnum, string>> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const UNKNOWN_LABEL = 'Sin definir';

@Pipe({
  name: 'incidentPriority',
})
export class IncidentPriorityPipe implements PipeTransform {
  transform(value: IncidentPriorityEnum | string | null | undefined): string {
    if (value === null || value === undefined) {
      return UNKNOWN_LABEL;
    }
    
    return PRIORITY_LABELS[value as IncidentPriorityEnum] ?? UNKNOWN_LABEL;
  }
}