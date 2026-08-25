import { InjectionToken } from '@angular/core';
import { AuthGateway } from '../../domain/ports/auth-gateway.port';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';
import { SessionStore } from '../../domain/ports/session-store.port';
import { UserRepository } from '../../domain/ports/user-repository.port';

/**
 * Fichas de inyección de los puertos.
 *
 * ## Por qué este archivo existe
 *
 * Es la consecuencia práctica de la regla «el dominio no importa Angular».
 * `InjectionToken` viene de `@angular/core`, así que **no puede vivir junto a
 * los puertos**. Se queda aquí, en infraestructura, y los puertos siguen
 * siendo interfaces puras.
 *
 * ## Por qué hace falta una ficha y no basta la interfaz
 *
 * TypeScript **borra las interfaces al compilar**: en tiempo de ejecución
 * `IncidentRepository` no existe, así que no hay nada que pedirle al
 * inyector. La ficha sí existe en ejecución y hace de nombre estable.
 *
 * Es exactamente el mismo motivo por el que en otros lenguajes se puede
 * inyectar «por interfaz» y en TypeScript no.
 */

export const INCIDENT_REPOSITORY = new InjectionToken<IncidentRepository>(
  'IncidentRepository',
);

export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AuthGateway');
export const SESSION_STORE = new InjectionToken<SessionStore>('SessionStore');