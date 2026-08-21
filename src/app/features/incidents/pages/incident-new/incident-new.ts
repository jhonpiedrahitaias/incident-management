import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IncidentService } from '../../../../core/services/incident-service';
import { UserService } from '../../../../core/services/user-service';
import { IncidentForm, IncidentFormValue } from '../../components/incident-form/incident-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IncidentStore } from '../../../../core/state/incident-store';
@Component({
  selector: 'app-incident-new',
  imports: [IncidentForm, RouterLink],
  templateUrl: './incident-new.html',
  styleUrl: './incident-new.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentNew {
  private readonly store = inject(IncidentStore);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  private readonly destroyRef = inject(DestroyRef);

  protected onSubmitted(value: IncidentFormValue): void {
    this.store
      .create({ ...value, reporterId: this.userService.currentUser().id })
      // Si el usuario se va de la página antes de que responda el servidor,
      // la suscripción se corta: sin esto se navegaría al detalle desde un
      // componente ya destruido, sacando al usuario de donde esté.
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => this.router.navigate(['/incidents', created.id]),
        error: () => undefined,
      });
  }
  protected onCancelled(): void {
    this.router.navigate(['/incidents']);
  }
}