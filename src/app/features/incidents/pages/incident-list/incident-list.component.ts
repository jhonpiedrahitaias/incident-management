import { Component, signal, computed, inject } from "@angular/core";
import { MOCK_INCIDENTS } from "../../../../core/mocks/incidents.mock";
import { Incident } from "../../../../core/models/incident.model";
import { IncidentCard } from "../../components/incident-card/incident-card.component";
import { UpperCasePipe } from "@angular/common";
import { IncidentPriorityPipe } from "../../../../shared/pipes/incident-priority-pipe";
import { IncidentHighlight } from "../../../../shared/directives/incident-highlight";
import { IncidentService } from "../../../../core/services/incident-service";

@Component({
  selector: 'app-incident-list',
imports: [
  IncidentCard, 
  UpperCasePipe, 
  IncidentPriorityPipe,
  IncidentHighlight
],
  templateUrl: './incident-list.component.html',
  styleUrl: './incident-list.component.scss',
})
export class IncidentList {
  private readonly incidentService = inject(IncidentService);
  protected readonly incidents = this.incidentService.incidents;
  protected readonly selectedId = signal<string | null>(null);

  protected readonly selectedIncident = computed(() =>
    this.incidents().find((incident) => incident.id === this.selectedId()),
  );

  protected readonly isRestoreDisabled = computed(() => this.incidentService.isPristine());

  protected onIncidentSelected(incident: Incident): void {
    this.selectedId.update((current) => (current === incident.id ? null : incident.id));
  }

  protected onDeleteRequested(incident: Incident): void {
  this.incidentService.remove(incident.id);
  }

  protected restoreIncidents(): void {
    this.incidentService.reset();
  }
}