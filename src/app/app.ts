import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MOCK_USERS } from './core/mocks/users.mock';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly systemTitle = 'Sistema de Gestión de Incidencias';
  protected readonly currentUser = MOCK_USERS[0];
}