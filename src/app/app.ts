import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MOCK_USERS } from './core/mocks/users.mock';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { UserService } from './core/services/user-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly userService = inject(UserService);
  protected readonly systemTitle = 'Sistema de Gestión de Incidencias';
  protected readonly currentUser = this.userService.currentUser;
}