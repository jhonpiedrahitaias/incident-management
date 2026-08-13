import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { Incident, IncidentChanges, IncidentDraft } from '../models/incident.model';
import { IncidentSearchCriteria } from '../models/incident-search-criteria.model';
import { IncidentApi } from '../api/incident-api';
import { LoadingService } from './loading-service';


@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private readonly api = inject(IncidentApi);
  private readonly collection = signal<readonly Incident[]>([]);
  private readonly loadingService = inject(LoadingService);
  private readonly lastError = signal<string | null>(null);
  private readonly initialized = signal(false);
  readonly incidents = this.collection.asReadonly();
  readonly error = this.lastError.asReadonly();
  readonly loading = this.loadingService.loading;
  readonly loaded = this.initialized.asReadonly();

  readonly totalCount = computed(() => this.collection().length);

  readonly criticalCount = computed(
    () => this.collection().filter((incident) => incident.priority === 'CRITICAL').length,
  );

  readonly openCount = computed(
    () => this.collection().filter((incident) => incident.status === 'OPEN').length,
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.request(this.api.getAll()).subscribe({
      next: (incidents) => {
        this.collection.set(incidents);
        this.initialized.set(true);
      },
      error: () => this.initialized.set(true),
    });
  }

  getAll(): readonly Incident[] {
    return [...this.collection()];
  }

  getById(id: string): Incident | undefined {
    return this.collection().find((incident) => incident.id === id);
  }

  search(criteria: IncidentSearchCriteria): readonly Incident[] {
    return this.collection().filter((incident) => criteria.matches(incident));
  }

  create(draft: IncidentDraft): Observable<Incident> {
    const now = new Date().toISOString();
    const incident: Incident = {
      ...draft,
      id: this.nextId(),
      status: draft.status ?? 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    return this.request(this.api.create(incident)).pipe(
      tap((created) => this.collection.update((current) => [...current, created])),
    );
  }

  update(id: string, changes: IncidentChanges): Observable<Incident> {
    const current = this.getById(id);

    if (!current) {
      return this.request(this.api.getById(id)) as Observable<Incident>;
    }

    const updated: Incident = {
      ...current,
      ...changes,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    return this.request(this.api.update(updated)).pipe(
      tap((saved) =>
        this.collection.update((incidents) =>
          incidents.map((incident) => (incident.id === id ? saved : incident)),
        ),
      ),
    );
  }

  remove(id: string): Observable<void> {
    return this.request(this.api.remove(id)).pipe(
      tap(() =>
        this.collection.update((current) => current.filter((incident) => incident.id !== id)),
      ),
    );
  }

  clearError(): void {
    this.lastError.set(null);
  }

  private request<T>(source: Observable<T>): Observable<T> {
    this.lastError.set(null);

    return source.pipe(
      tap({
        error: (error: Error) => this.lastError.set(error.message),
      })
    );
  }

  private nextId(): string {
    const highest = this.collection().reduce((max, incident) => {
      const value = Number.parseInt(incident.id.replace(/\D/g, ''), 10);
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 0);

    return `inc-${String(highest + 1).padStart(3, '0')}`;
  }
}