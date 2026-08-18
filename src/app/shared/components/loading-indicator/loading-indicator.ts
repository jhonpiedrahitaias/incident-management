import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  imports: [],
  templateUrl: './loading-indicator.html',
  styleUrl: './loading-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingIndicator {
  readonly message = input('Cargando…');
}