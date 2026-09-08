import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IncidentPriorityPipe } from '../../../../shared/pipes/incident-priority-pipe';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time-pipe';
import { IncidentHighlight } from '../../../../shared/directives/incident-highlight';
import { IncidentStore } from '../../../../core/infrastructure/state/incident-store';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import { IncidentActivity } from '../../components/incident-activity/incident-activity';
import { IncidentStatePipe } from '../../../../shared/pipes/incident-state-pipe';
import { SESSION, UPDATE_INCIDENT_STATUS, USER_REPOSITORY } from '../../../../core/infrastructure/di/tokens';
import { IncidentStatusEnum, nextStatuses } from '../../../../core/domain/models/incident.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly userService = inject(USER_REPOSITORY);
  readonly id = input.required<string>();
  protected readonly incident = computed(() => this.store.getById(this.id()));
  protected readonly canManageIncidents = inject(SESSION).canManageIncidents;
  private readonly updateStatus = inject(UPDATE_INCIDENT_STATUS);
  private readonly destroyRef = inject(DestroyRef);


  protected readonly reporterName = computed(() => {
    const reporterId = this.incident()?.reporterId;
    return reporterId ? (this.userService.getById(reporterId)?.name ?? reporterId) : '';
  });

  protected readonly agentName = computed(() => {
    const agentId = this.incident()?.assignedAgentId;
    return agentId ? (this.userService.getById(agentId)?.name ?? agentId) : '';
  });

  /** Estado cuyo botón está esperando respuesta, para deshabilitarlo. */
  private readonly cambiando = signal<IncidentStatusEnum | null>(null);
  protected readonly cambiandoA = this.cambiando.asReadonly();

  /** Mensaje si el cambio no se pudo aplicar. */
  private readonly errorCambio = signal<string | null>(null);
  protected readonly statusError = this.errorCambio.asReadonly();

  /**
   * Estados a los que se puede pasar desde el actual.
   *
   * La lista sale del **dominio**, no de la plantilla: así la pantalla no
   * puede ofrecer un cambio que el caso de uso vaya a rechazar.
   */
  protected readonly siguientesEstados = computed<readonly IncidentStatusEnum[]>(() => {
    const incident = this.incident();
    return incident ? nextStatuses(incident.status) : [];
  });

  /**
   * Texto del botón para cada destino.
   *
   * Nombra la **acción**, no el estado: «Resolver» se entiende mejor que
   * «Resuelta» en un botón.
   */
  protected accionPara(destino: IncidentStatusEnum): string {
    const acciones: Readonly<Record<IncidentStatusEnum, string>> = {
      OPEN: 'Reabrir',
      IN_PROGRESS: 'En progreso',
      RESOLVED: 'Marcar como resuelta',
      CLOSED: 'Cerrar',
    };

    return acciones[destino];
  }

  protected cambiarEstado(destino: IncidentStatusEnum): void {
    const incident = this.incident();

    if (!incident || this.cambiando()) {
      return;
    }

    this.cambiando.set(destino);
    this.errorCambio.set(null);

    this.updateStatus
      .execute(incident.id, destino)
      // Si el usuario se va antes de que responda el servidor, la suscripción
      // se corta: escribir señales de un componente destruido no sirve.
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // El caso de uso ya actualizó el modelo de lectura: la pantalla se
        // repinta sola porque `incident` es un `computed` sobre el store.
        next: () => this.cambiando.set(null),
        error: (fallo: Error) => {
          this.cambiando.set(null);
          this.errorCambio.set(fallo.message);
        },
      });
  }
}