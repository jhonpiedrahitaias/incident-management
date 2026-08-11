import { computed, Injectable, signal } from '@angular/core';
import { Incident, IncidentDraft } from '../models/incident.model';
import { IncidentSearchCriteria } from '../models/incident-search-criteria.model';
import { MOCK_INCIDENTS } from '../mocks/incidents.mock';


@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  readonly totalCount = computed(() => this.collection().length);
  private readonly collection = signal<readonly Incident[]>(MOCK_INCIDENTS);
  readonly incidents = this.collection.asReadonly();

  readonly criticalCount = computed(
    () => this.collection().filter((incident) => incident.priority === 'CRITICAL').length,
  );

  readonly openCount = computed(
    () => this.collection().filter((incident) => incident.status === 'OPEN').length,
  );

  getAll(): readonly Incident[] {
    return [...this.collection()];
  }

  getById(id: string): Incident | undefined {
    return this.collection().find((incident) => incident.id === id);
  }

  search(criteria: IncidentSearchCriteria): readonly Incident[] {
    return this.collection().filter((incident) => criteria.matches(incident));
  }

  create(draft: IncidentDraft): Incident {
    const now = new Date().toISOString();
    const incident: Incident = {
      ...draft,
      id: this.nextId(),
      status: draft.status ?? 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    this.collection.update((current) => [...current, incident]);
    return incident;
  }

  remove(id: string): boolean {
    const existed = this.collection().some((incident) => incident.id === id);

    if (existed) {
      this.collection.update((current) => current.filter((incident) => incident.id !== id));
    }

    return existed;
  }

  reset(): void {
    this.collection.set(MOCK_INCIDENTS);
  }

  isPristine(): boolean {
    return this.collection() === MOCK_INCIDENTS;
  }

  private nextId(): string {
    const highest = this.collection().reduce((max, incident) => {
      const value = Number.parseInt(incident.id.replace(/\D/g, ''), 10);
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 0);

    return `inc-${String(highest + 1).padStart(3, '0')}`;
  }
}