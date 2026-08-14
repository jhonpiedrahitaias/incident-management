import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';

export const INCIDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/incidents-layout/incidents-layout').then((m) => m.IncidentsLayout),
    children: [
      {
        path: '',
        title: 'Incidencias · Gestión de Incidencias',
        loadComponent: () =>
          import('./pages/incident-list/incident-list').then((m) => m.IncidentList),
      },
      {
        path: 'new',
        title: 'Nueva incidencia · Gestión de Incidencias',
        loadComponent: () => import('./pages/incident-new/incident-new').then((m) => m.IncidentNew),
      },
      {
        path: ':id/edit',
        title: 'Editar incidencia · Gestión de Incidencias',
        canActivate: [roleGuard('ADMIN', 'AGENT')],
        loadComponent: () =>
          import('./pages/incident-edit/incident-edit').then((m) => m.IncidentEdit),
      },
      {
        path: ':id',
        title: 'Detalle de incidencia · Gestión de Incidencias',
        loadComponent: () =>
          import('./pages/incident-detail/incident-detail').then((m) => m.IncidentDetail),
      },
    ],
  },
];