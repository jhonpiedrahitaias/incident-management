import { User, UserRole } from '../models/user.model';

export interface SessionQuery {
  /** Quién está dentro, o `null` si nadie. */
  currentUser(): User | null;

  /** Su rol, o `null` sin sesión. */
  role(): UserRole | null;

  /** ¿Hay sesión activa? */
  isAuthenticated(): boolean;

  /** ¿Se le puede ofrecer modificar incidencias? */
  canManageIncidents(): boolean;

  /** ¿Se le puede ofrecer el panel de administración? */
  canAdminister(): boolean;

  /** Cierra la sesión. Es lo único que esta interfaz cambia. */
  logout(): void;
}