import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Incident } from "../../../../core/models/incident.model";
import { DatePipe, LowerCasePipe, TitleCasePipe, UpperCasePipe } from "@angular/common";
import { IncidentPriorityPipe } from "../../../../shared/pipes/incident-priority-pipe";
import { RelativeTimePipe } from "../../../../shared/pipes/relative-time-pipe";
import { FocusWithin } from "../../../../shared/directives/focus-within";
import { IncidentHighlight } from "../../../../shared/directives/incident-highlight";


@Component({
  selector: 'app-incident-card',
  imports: [
    DatePipe,
    LowerCasePipe,
    TitleCasePipe,
    UpperCasePipe,
    IncidentPriorityPipe,
    RelativeTimePipe,
     IncidentHighlight,
    FocusWithin,
  ],
  templateUrl: './incident-card.component.html',
  styleUrl: './incident-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentCard {
  readonly incident = input.required<Incident>();

  readonly selected = input(false);

  readonly incidentSelected = output<Incident>();

  readonly deleteRequested = output<Incident>();

  protected onSelect(): void {
    this.incidentSelected.emit(this.incident());
  }

  protected onDelete(): void {
    this.deleteRequested.emit(this.incident());
  }
}