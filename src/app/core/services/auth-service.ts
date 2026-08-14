import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Credentials, Session } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

const STORAGE_KEY = 'incident-management.session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly session = signal<Session | null>(this.restoreSession());
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
      .post<AuthResponse>('/api/auth/login', credentials)
      .pipe(tap((response) => this.startSession(response)));
  }

  logout(): void {
    this.session.set(null);
    this.storage?.removeItem(STORAGE_KEY);
  }

  private startSession(response: AuthResponse): void {
    const session: Session = {
      token: response.token,
      user: response.user,
      expiresAt: response.expiresAt,
    };

    this.session.set(session);
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private restoreSession(): Session | null {
    const raw = this.storage?.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as Session;

      if (!session?.token || !session?.user || session.expiresAt <= Date.now()) {
        this.storage?.removeItem(STORAGE_KEY);
        return null;
      }

      return session;
    } catch {
      this.storage?.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private get storage(): Storage | null {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  }
}