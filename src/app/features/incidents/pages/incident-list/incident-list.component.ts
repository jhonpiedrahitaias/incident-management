import { UpperCasePipe } from "@angular/common";
import { Component, inject, signal, computed } from "@angular/core";
import { IncidentSearchCriteria } from "../../../../core/models/incident-search-criteria.model";
import { IncidentStatus, IncidentPriority, Incident } from "../../../../core/models/incident.model";
import { IncidentService } from "../../../../core/services/incident-service";
import { IncidentHighlight } from "../../../../shared/directives/incident-highlight";
import { IncidentPriorityPipe } from "../../../../shared/pipes/incident-priority-pipe";
import { IncidentCard } from "../../components/incident-card/incident-card.component";
import { UserService } from "../../../../core/services/user-service";
import { IncidentForm, IncidentFormValue } from "../../components/incident-form/incident-form.component";

const ANY = '';

@Component({
  selector: 'app-incident-list',
  imports: [
    IncidentCard,
    IncidentForm,
    UpperCasePipe,
    IncidentPriorityPipe,
    IncidentHighlight,
  ],
  templateUrl: './incident-list.component.html',
  styleUrl: './incident-list.component.scss',
})
export class IncidentList {
  private readonly incidentService = inject(IncidentService);
  private readonly userService = inject(UserService);

  protected readonly incidents = this.incidentService.incidents;
  protected readonly totalCount = this.incidentService.totalCount;
  protected readonly criticalCount = this.incidentService.criticalCount;
  protected readonly openCount = this.incidentService.openCount;

  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<IncidentStatus | typeof ANY>(ANY);
  protected readonly priorityFilter = signal<IncidentPriority | typeof ANY>(ANY);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly criteria = computed(
    () =>
      new IncidentSearchCriteria(
        this.searchTerm(),
        this.statusFilter() || undefined,
        this.priorityFilter() || undefined,
      ),
  );

  protected readonly visibleIncidents = computed(() => {
    const criteria = this.criteria();
    return this.incidents().filter((incident) => criteria.matches(incident));
  });

  protected readonly visibleCount = computed(() => this.visibleIncidents().length);

  protected readonly hasActiveFilters = computed(
    () =>
      this.searchTerm().trim() !== '' ||
      this.statusFilter() !== ANY ||
      this.priorityFilter() !== ANY,
  );

  protected readonly selectedIncident = computed(() =>
    this.incidents().find((incident) => incident.id === this.selectedId()),
  );

  protected readonly isRestoreDisabled = computed(() => this.incidentService.isPristine());

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  protected onStatusFilterChange(value: string): void {
    this.statusFilter.set(value as IncidentStatus | typeof ANY);
  }

  protected onPriorityFilterChange(value: string): void {
    this.priorityFilter.set(value as IncidentPriority | typeof ANY);
  }

  protected clearFilters(): void {
    this.searchTerm.set(ANY);
    this.statusFilter.set(ANY);
    this.priorityFilter.set(ANY);
  }

  protected onIncidentSelected(incident: Incident): void {
    this.selectedId.update((current) => (current === incident.id ? null : incident.id));
  }

  protected onDeleteRequested(incident: Incident): void {
    this.incidentService.remove(incident.id);
  }

  protected restoreIncidents(): void {
    this.incidentService.reset();
  }

  protected onIncidentSubmitted(value: IncidentFormValue): void {
    this.incidentService.create({
      ...value,
      reporterId: this.userService.currentUser().id,
    });
  }
}