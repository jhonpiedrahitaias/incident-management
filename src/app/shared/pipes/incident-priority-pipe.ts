import { Pipe, PipeTransform } from '@angular/core';
import { IncidentPriority } from '../../core/models/incident.model';

const PRIORITY_LABELS: Readonly<Record<IncidentPriority, string>> = {
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
  transform(value: IncidentPriority | string | null | undefined): string {
    if (value === null || value === undefined) {
      return UNKNOWN_LABEL;
    }
    
    return PRIORITY_LABELS[value as IncidentPriority] ?? UNKNOWN_LABEL;
  }
}