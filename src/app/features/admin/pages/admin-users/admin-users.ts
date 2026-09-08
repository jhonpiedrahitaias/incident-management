import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SESSION, USER_REPOSITORY } from '../../../../core/infrastructure/di/tokens';

@Component({
  selector: 'app-admin-users',
  imports: [],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly userService = inject(USER_REPOSITORY);
  private readonly authService = inject(SESSION);

  protected readonly users = this.userService.getAll();

  /** Identificador de quien está viendo la página.*/
  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
}
