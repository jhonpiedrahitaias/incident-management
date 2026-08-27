import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CREATE_INCIDENT } from '../../../../core/infrastructure/di/tokens';
import { LoadingService } from '../../../../core/infrastructure/services/loading-service';
import { UserService } from '../../../../core/infrastructure/services/user-service';
import { IncidentForm, IncidentFormValue } from '../../components/incident-form/incident-form';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-incident-new',
  imports: [IncidentForm, RouterLink, LoadingIndicator],
  templateUrl: './incident-new.html',
  styleUrl: './incident-new.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentNew {
  // El caso de uso, no el store: esta pantalla ejecuta una operación de
  // negocio, no manipula estado.
  private readonly createIncident = inject(CREATE_INCIDENT);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = inject(LoadingService).loading;

  private readonly submitError = signal<string | null>(null);
  protected readonly error = this.submitError.asReadonly();

  protected onSubmitted(value: IncidentFormValue): void {
    this.submitError.set(null);

    this.createIncident
      .execute({ ...value, reporterId: this.userService.currentUser().id })
      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe({
        next: (created) => this.router.navigate(['/incidents', created.id]),
        error: (failure: Error) => this.submitError.set(failure.message),
      });
  }
  
  protected onCancelled(): void {
    this.router.navigate(['/incidents']);
  }
}