import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Incident } from "../../../../core/models/incident.model";
import { DatePipe, LowerCasePipe, TitleCasePipe, UpperCasePipe } from "@angular/common";
import { IncidentPriorityPipe } from "../../../../shared/pipes/incident-priority-pipe";
import { RelativeTimePipe } from "../../../../shared/pipes/relative-time-pipe";
import { FocusWithin } from "../../../../shared/directives/focus-within";
import { IncidentHighlight } from "../../../../shared/directives/incident-highlight";
import { RouterLink } from "@angular/router";


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
    RouterLink,
  ],
  templateUrl: './incident-card.html',
  styleUrl: './incident-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentCard {
  readonly incident = input.required<Incident>();
  readonly selected = input(false);
  readonly incidentSelected = output<Incident>();
  readonly deleteRequested = output<Incident>();
  readonly detailLink = input<readonly unknown[] | null>(null);
  
  protected onSelect(): void {
    this.incidentSelected.emit(this.incident());
  }

  protected onDelete(): void {
    this.deleteRequested.emit(this.incident());
  }
}