import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './features/layout/header/header';
import { Footer } from './features/layout/footer/footer';
import { LoadingService } from './core/infrastructure/services/loading-service';
import { LIST_INCIDENTS } from './core/infrastructure/di/tokens';
import { IncidentStore } from './core/infrastructure/state/incident-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly listIncidents = inject(LIST_INCIDENTS);
  private readonly store = inject(IncidentStore);
  protected readonly systemTitle = 'Sistema de Gestión de Incidencias';

  protected readonly loading = inject(LoadingService).loading;

    constructor() {
    this.store.clearError();

    this.listIncidents.execute().subscribe({
      error: (failure: Error) => {
        this.store.markLoaded();
        this.store.setError(failure.message);
      },
    });
  }
}