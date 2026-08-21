import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IncidentService } from '../../../../core/services/incident-service';
import { UserService } from '../../../../core/services/user-service';
import { IncidentPriorityPipe } from '../../../../shared/pipes/incident-priority-pipe';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time-pipe';
import { IncidentHighlight } from '../../../../shared/directives/incident-highlight';
import { AuthService } from '../../../../core/services/auth-service';
import { IncidentStore } from '../../../../core/state/incident-store';

@Component({
  selector: 'app-incident-detail',
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    IncidentPriorityPipe,
    RelativeTimePipe,
    IncidentHighlight,
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