import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IncidentService } from '../../../../core/services/incident-service';
import { IncidentPriorityPipe } from '../../../../shared/pipes/incident-priority-pipe';
import { IncidentHighlight } from '../../../../shared/directives/incident-highlight';
import { IncidentStore } from '../../../../core/state/incident-store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import { DashboardStats } from '../../components/dashboard-stats/dashboard-stats';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    EmptyState,
    LoadingIndicator,
    DashboardStats,
    IncidentPriorityPipe,
    IncidentHighlight,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly store = inject(IncidentStore);

  protected readonly totalCount = this.store.totalCount;
  protected readonly criticalCount = this.store.criticalCount;
  protected readonly openCount = this.store.openCount;

  protected readonly criticalIncidents = computed(() =>
    this.store.incidents().filter((incident) => incident.priority === 'CRITICAL'),
  );
}