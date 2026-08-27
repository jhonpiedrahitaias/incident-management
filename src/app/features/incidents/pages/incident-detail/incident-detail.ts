import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/infrastructure/services/user-service';
import { IncidentPriorityPipe } from '../../../../shared/pipes/incident-priority-pipe';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time-pipe';
import { IncidentHighlight } from '../../../../shared/directives/incident-highlight';
import { AuthService } from '../../../../core/infrastructure/services/auth-service';
import { IncidentStore } from '../../../../core/infrastructure/state/incident-store';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import { IncidentActivity } from '../../components/incident-activity/incident-activity';
import { IncidentStatePipe } from '../../../../shared/pipes/incident-state-pipe';

@Component({
  selector: 'app-incident-detail',
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    IncidentPriorityPipe,
    RelativeTimePipe,
    IncidentHighlight,
    LoadingIndicator,
    IncidentActivity,
    IncidentStatePipe
  ],
  templateUrl: './incident-detail.html',
  styleUrl: './incident-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetail {
  private readonly store = inject(IncidentStore);
  private readonly userService = inject(UserService);
  readonly id = input.required<string>();
  protected readonly incident = computed(() => this.store.getById(this.id()));
  protected readonly canManageIncidents = inject(AuthService).canManageIncidents;

  protected readonly reporterName = computed(() => {
    const reporterId = this.incident()?.reporterId;
    return reporterId ? (this.userService.getById(reporterId)?.name ?? reporterId) : '';
  });

  protected readonly agentName = computed(() => {
    const agentId = this.incident()?.assignedAgentId;
    return agentId ? (this.userService.getById(agentId)?.name ?? agentId) : '';
  });
}