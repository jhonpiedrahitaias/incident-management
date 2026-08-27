import { InjectionToken } from '@angular/core';
import { AuthGateway } from '../../domain/ports/auth-gateway.port';
import { CreateIncidentUseCase } from '../../application/use-cases/create-incident.use-case';
import { IncidentCache } from '../../domain/ports/incident-cache.port';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';
import { ListIncidentsUseCase } from '../../application/use-cases/list-incidents.use-case';
import { SessionStore } from '../../domain/ports/session-store.port';
import { UpdateIncidentStatusUseCase } from '../../application/use-cases/update-incident-status.use-case';
import { UserRepository } from '../../domain/ports/user-repository.port';


export const INCIDENT_REPOSITORY = new InjectionToken<IncidentRepository>(
  'IncidentRepository',
);

/** Modelo de lectura en memoria. Lo cumple `IncidentStore`. */
export const INCIDENT_CACHE = new InjectionToken<IncidentCache>('IncidentCache');
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AuthGateway');
export const SESSION_STORE = new InjectionToken<SessionStore>('SessionStore');

// --- Casos de uso ----------------------------------------------------------

export const CREATE_INCIDENT = new InjectionToken<CreateIncidentUseCase>(
  'CreateIncidentUseCase',
);

export const LIST_INCIDENTS = new InjectionToken<ListIncidentsUseCase>(
  'ListIncidentsUseCase',
);

export const UPDATE_INCIDENT_STATUS = new InjectionToken<UpdateIncidentStatusUseCase>(
  'UpdateIncidentStatusUseCase',
);