import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Credentials, Session } from '../../domain/models/auth.model';
import { User, UserRole } from '../../domain/models/user.model';
import { environment } from '../../../../environments/environment';
import { AuthGateway } from '../../domain/ports/auth-gateway.port';
import { SESSION_STORE } from '../di/tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly sessionStore = inject(SESSION_STORE);
  private readonly session = signal<Session | null>(this.sessionStore.read());
  readonly currentUser = computed<User | null>(() => this.session()?.user ?? null);
  readonly token = computed<string | null>(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<UserRole | null>(() => this.session()?.user.role ?? null);
  readonly canManageIncidents = computed(() => this.hasAnyRole('ADMIN', 'AGENT'));
  readonly canAdminister = computed(() => this.hasAnyRole('ADMIN'));

  hasAnyRole(...roles: readonly UserRole[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.startSession(response)));
  }

  logout(): void {
    this.session.set(null);
    this.sessionStore.clear();
  }

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