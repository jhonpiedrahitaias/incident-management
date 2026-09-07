export type UserRole = 'ADMIN' | 'AGENT' | 'REQUESTER';

export interface User {
  readonly id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Quien atiende incidencias puede modificarlas. */
export function canManageIncidents(role: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'AGENT';
}

/** La administración es exclusiva del rol ADMIN. */
export function canAdminister(role: UserRole | null): boolean {
  return role === 'ADMIN';
}

/** ¿El rol actual está entre los indicados? `null` nunca lo está. */
export function hasAnyRole(
  role: UserRole | null,
  ...roles: readonly UserRole[]
): boolean {
  return role !== null && roles.includes(role);
}