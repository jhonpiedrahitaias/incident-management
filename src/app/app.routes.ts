import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: 'incidents',
    loadComponent: () =>
        import('./features/incidents/pages/incident-list/incident-list.component')
        .then(m => m.IncidentListComponent),
    }
];