import { Observable, tap } from 'rxjs';
import { Incident } from '../../domain/models/incident.model';
import { IncidentCache } from '../../domain/ports/incident-cache.port';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';

export class ListIncidentsUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly cache: IncidentCache,
  ) {}

  execute(): Observable<Incident[]> {
    return this.repository.getAll().pipe(tap((incidents) => this.cache.setAll(incidents)));
  }
}