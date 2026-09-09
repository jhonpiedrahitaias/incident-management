import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Credentials, Session } from '../../domain/models/auth.model';
import { AuthGateway } from '../../domain/ports/auth-gateway.port';
import { canAdminister, canManageIncidents, hasAnyRole, User, UserRole } from '../../domain/models/user.model';
import { SESSION_STORE } from '../di/tokens';
import { environment } from '../../../../environments/environment';
import { SessionQuery } from '../../domain/ports/session-query.port';

/**
 * Autenticación simulada.
 *
 * Es el único punto que sabe si hay alguien dentro y quién es. El resto de
 * la aplicación solo lee sus señales, igual que hace con `IncidentService`
 * para los datos.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthGateway, SessionQuery {
  private readonly http = inject(HttpClient);
  // El puerto, no `sessionStorage`. Este servicio ya no sabe dónde se guarda
  // la sesión, que es lo que permitirá pasar a una cookie `HttpOnly` (R-01)
  // sin tocarlo.
  private readonly sessionStore = inject(SESSION_STORE);

  /** Sesión activa. Privada: solo se cambia iniciando o cerrando sesión. */
  private readonly session = signal<Session | null>(this.sessionStore.read());

  readonly currentUser = computed<User | null>(() => this.session()?.user ?? null);

  readonly token = computed<string | null>(() => this.session()?.token ?? null);

  readonly isAuthenticated = computed(() => this.session() !== null);

  readonly role = computed<UserRole | null>(() => this.session()?.user.role ?? null);

  /**
   * `true` si el usuario tiene alguno de los roles indicados.
   *
   * Es el único sitio donde se decide «puede o no puede». Tanto los guards
   * como la interfaz preguntan aquí, así que no hay dos reglas distintas
   * para lo mismo.
   */
  hasAnyRole(...roles: readonly UserRole[]): boolean {
     return hasAnyRole(this.role(), ...roles);
  }

  // --- Permisos del dominio ------------------------------------------------
  //
  // Se nombran por lo que **permiten hacer**, no por el rol que lo permite.
  // Si mañana un rol nuevo puede editar, cambia esta línea y no las quince
  // plantillas que preguntan.

  /** Solo quien atiende incidencias puede modificarlas. */
  readonly canManageIncidents = computed(() => canManageIncidents(this.role()));

  /** La administración es exclusiva del rol ADMIN. */
  readonly canAdminister = computed(() => canAdminister(this.role()));

  /**
   * Inicia sesión contra la API.
   *
   * La sesión solo se guarda cuando el servidor responde: si las
   * credenciales son incorrectas, el error sube al componente ya traducido
   * por el interceptor del Día 18.
   */
  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.startSession(response)));
  }

  /** Cierra la sesión y la borra del almacenamiento. */
  logout(): void {
    this.session.set(null);
    this.sessionStore.clear();
  }

  // --- Interno -------------------------------------------------------------

  private startSession(response: AuthResponse): void {
    const session: Session = {
      token: response.token,
      user: response.user,
      expiresAt: response.expiresAt,
    };

    this.session.set(session);
    this.sessionStore.save(session);
  }

}