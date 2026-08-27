import { Observable, tap } from 'rxjs';
import {
  INITIAL_STATUS,
  Incident,
  IncidentDraft,
  nextIncidentId,
} from '../../domain/models/incident.model';
import { Clock, systemClock } from '../../domain/ports/system.port';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';
import { IncidentCache } from '../../domain/ports/incident-cache.port';

export class CreateIncidentUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly cache: IncidentCache,
    private readonly now: Clock = systemClock,
  ) {}

  execute(draft: IncidentDraft): Observable<Incident> {
    const timestamp = this.now();

    const incident: Incident = {
      ...draft,
      id: nextIncidentId(this.cache.snapshot()),
      status: draft.status ?? INITIAL_STATUS,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.create(incident).pipe(tap((saved) => this.cache.add(saved)));
  }
}