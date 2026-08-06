import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Incident } from "../../../../core/models/incident.model";
import { DatePipe, LowerCasePipe, TitleCasePipe, UpperCasePipe } from "@angular/common";
import { IncidentPriorityPipe } from "../../../../shared/pipes/incident-priority-pipe";
import { RelativeTimePipe } from "../../../../shared/pipes/relative-time-pipe";


@Component({
  selector: 'app-incident-card',
  imports: [
    DatePipe,
    LowerCasePipe,
    TitleCasePipe,
    UpperCasePipe,
    IncidentPriorityPipe,
    RelativeTimePipe,
  ],
  templateUrl: './incident-card.component.html',
  styleUrl: './incident-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentCard {
  readonly incident = input.required<Incident>();

  /** Marca la tarjeta como seleccionada. Opcional, `false` por defecto. */
  readonly selected = input(false);

  /** El usuario seleccionó la incidencia. */
  readonly incidentSelected = output<Incident>();

  /** El usuario pidió eliminarla: el hijo avisa, no elimina nada. */
  readonly deleteRequested = output<Incident>();

  protected onSelect(): void {
    this.incidentSelected.emit(this.incident());
  }

  protected onDelete(): void {
    this.deleteRequested.emit(this.incident());
  }
}