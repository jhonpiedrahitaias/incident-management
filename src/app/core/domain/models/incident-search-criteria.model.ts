import { Incident, IncidentPriorityEnum, IncidentStatusEnum } from './incident.model';

export const ANY = '';

//Filters
export interface IncidentSearchCriteria {
  readonly searchTerm: string;
  readonly status: IncidentStatusEnum | typeof ANY;
  readonly priority: IncidentPriorityEnum | typeof ANY;
  readonly category: string;
}

export const NO_CRITERIA: IncidentSearchCriteria = {
  searchTerm: ANY,
  status: ANY,
  priority: ANY,
  category: ANY,
};

export function hasActiveCriteria(criteria: IncidentSearchCriteria): boolean {
  return (
    criteria.searchTerm.trim() !== '' ||
    criteria.status !== ANY ||
    criteria.priority !== ANY ||
    criteria.category !== ANY
  );
}

export function matchesLocalCriteria(
  incident: Incident,
  criteria: IncidentSearchCriteria,
): boolean {
  return (
    (criteria.status === ANY || incident.status === criteria.status) &&
    (criteria.priority === ANY || incident.priority === criteria.priority) &&
    (criteria.category === ANY || incident.category === criteria.category)
  );
}