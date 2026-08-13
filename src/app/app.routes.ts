import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

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
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    // Comodín: cualquier dirección que no encaje arriba.
    path: '**',
    title: 'Página no encontrada · Gestión de Incidencias',
    loadComponent: () => import('./shared/pages/not-found/not-found').then((m) => m.NotFound),
  },
];