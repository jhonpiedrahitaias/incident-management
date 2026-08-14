import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './features/layout/header/header';
import { Footer } from './features/layout/footer/footer';
import { LoadingService } from './core/services/loading-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly systemTitle = 'Sistema de Gestión de Incidencias';

  protected readonly loading = inject(LoadingService).loading;
}