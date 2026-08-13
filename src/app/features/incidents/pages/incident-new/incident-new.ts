import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IncidentService } from '../../../../core/services/incident-service';
import { UserService } from '../../../../core/services/user-service';
import { IncidentForm, IncidentFormValue } from '../../components/incident-form/incident-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-incident-new',
  imports: [IncidentForm, RouterLink],
  templateUrl: './incident-new.html',
  styleUrl: './incident-new.scss',
})
export class IncidentNew {
  private readonly incidentService = inject(IncidentService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  protected readonly loading = this.incidentService.loading;
  protected readonly error = this.incidentService.error;
  private readonly destroyRef = inject(DestroyRef);

  protected onSubmitted(value: IncidentFormValue): void {
    this.incidentService
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