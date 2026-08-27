import { Routes } from '@angular/router';
import { authGuard } from './core/infrastructure/guards/auth-guard';
import { roleGuard } from './core/infrastructure/guards/role-guard';

export const routes: Routes = [
  {
    // Única ruta pública: es a donde manda el guard cuando no hay sesión.
    path: 'login',
    title: 'Iniciar sesión · Gestión de Incidencias',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    title: 'Panel de control · Gestión de Incidencias',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'incidents',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/incidents/incidents.routes').then((m) => m.INCIDENT_ROUTES),
  },
    {
    path: 'admin',
    title: 'Administración · Gestión de Incidencias',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/pages/admin-users/admin-users').then((m) => m.AdminUsers),
  },
  {
    path: 'forbidden',
    title: 'Acceso denegado · Gestión de Incidencias',
    loadComponent: () => import('./shared/pages/forbidden/forbidden').then((m) => m.Forbidden),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    // Comodín: cualquier dirección que no encaje arriba.
    path: '**',
    title: 'Página no encontrada · Gestión de Incidencias',
    loadComponent: () => import('./shared/pages/not-found/not-found').then((m) => m.NotFound),
  },
];