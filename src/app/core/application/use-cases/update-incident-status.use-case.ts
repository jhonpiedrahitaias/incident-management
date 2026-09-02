import { Observable, map, switchMap, tap, throwError } from 'rxjs';
import { Clock, systemClock } from '../../domain/ports/system.port';
import { IncidentCache } from '../../domain/ports/incident-cache.port';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';
import { canTransitionTo, Incident, IncidentStatusEnum } from '../../domain/models/incident.model';

export class UpdateIncidentStatusUseCase {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly cache: IncidentCache,
    private readonly now: Clock = systemClock,
  ) {}

  execute(id: string, status: IncidentStatusEnum): Observable<Incident> {
    return this.repository.getById(id).pipe(
      switchMap((current) => {
        if (!canTransitionTo(current.status, status)) {
          // Se corta aquí: sin petición y sin tocar el modelo de lectura.
          return throwError(
            () =>
              new Error(
                `No se puede pasar de ${current.status} a ${status}.`,
              ),
          );
        }

        return [current];
      }),
      map((current) => ({ ...current, status, updatedAt: this.now() })),
      switchMap((updated) => this.repository.update(updated)),
      tap((saved) => this.cache.replace(saved)),
    );
  }
}