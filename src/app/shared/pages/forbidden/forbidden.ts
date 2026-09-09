import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SESSION } from '../../../core/infrastructure/di/tokens';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Forbidden {
  private readonly authService = inject(SESSION);
  protected readonly role = this.authService.role;
  protected readonly userName = this.authService.currentUser;
}
