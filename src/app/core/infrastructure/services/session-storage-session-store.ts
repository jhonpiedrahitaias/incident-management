import { Injectable } from '@angular/core';
import { Session } from '../../domain/models/auth.model';
import { SessionStore } from '../../domain/ports/session-store.port';

const STORAGE_KEY = 'incident-management.session';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageSessionStore implements SessionStore {
  read(): Session | null {
    const raw = this.storage?.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as Session;

      if (!session?.token || !session?.user || session.expiresAt <= Date.now()) {
        this.clear();
        return null;
      }

      return session;
    } catch {
      this.clear();
      return null;
    }
  }

  save(session: Session): void {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    this.storage?.removeItem(STORAGE_KEY);
  }

  private get storage(): Storage | null {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  }
}