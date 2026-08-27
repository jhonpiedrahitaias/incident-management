import { Observable, map, switchMap, tap } from 'rxjs';
import { Incident, IncidentStatusEnum } from '../../domain/models/incident.model';
import { Clock, systemClock } from '../../domain/ports/system.port';
import { IncidentCache } from '../../domain/ports/incident-cache.port';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';

export class UpdateIncidentStatusUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly cache: IncidentCache,
    private readonly now: Clock = systemClock,
  ) {}

  execute(id: string, status: IncidentStatusEnum): Observable<Incident> {
    return this.repository.getById(id).pipe(
      map((current) => ({ ...current, status, updatedAt: this.now() })),
      switchMap((updated) => this.repository.update(updated)),
      tap((saved) => this.cache.replace(saved)),
    );
  }
}