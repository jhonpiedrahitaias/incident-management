import { Component, signal } from '@angular/core';
import { MOCK_INCIDENTS } from '../../../../core/mocks/incidents.mock';
import { Incident } from '../../../../core/models/incident.model';

@Component({
  selector: 'app-incident-list',
  imports: [],
  templateUrl: './incident-list.component.html',
  styleUrl: './incident-list.component.scss',
})
export class IncidentListComponent {
  protected readonly incidents = signal<readonly Incident[]>(MOCK_INCIDENTS);

  protected toggleIncidents(): void {
    this.incidents.update((current) => (current.length > 0 ? [] : MOCK_INCIDENTS));
  }
}
