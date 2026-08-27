import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../../core/infrastructure/services/auth-service';
import { UserService } from '../../../../core/infrastructure/services/user-service';

@Component({
  selector: 'app-admin-users',
  imports: [],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  protected readonly users = this.userService.getAll();

  /** Identificador de quien está viendo la página.*/
  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
}
