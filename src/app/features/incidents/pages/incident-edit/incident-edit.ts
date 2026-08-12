import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IncidentService } from '../../../../core/services/incident-service';
import { IncidentForm, IncidentFormValue } from '../../components/incident-form/incident-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-incident-edit',
  imports: [IncidentForm, RouterLink],
  templateUrl: './incident-edit.html',
  styleUrl: './incident-edit.scss',
})
export class IncidentEdit {
  private readonly incidentService = inject(IncidentService);
  private readonly router = inject(Router);
  readonly id = input.required<string>();
  private readonly destroyRef = inject(DestroyRef);
  protected readonly incident = computed(() => this.incidentService.getById(this.id()));
  protected readonly loading = this.incidentService.loading;
  protected readonly error = this.incidentService.error;
  
  protected readonly initialValue = computed<IncidentFormValue | null>(() => {
    const incident = this.incident();

    if (!incident) {
      return null;
    }

    return {
      title: incident.title,
      description: incident.description,
      category: incident.category,
      priority: incident.priority,
      tags: incident.tags ?? [],
    };
  });


  protected onSubmitted(value: IncidentFormValue): void {
    this.incidentService.update(this.id(), value).subscribe({
      next: () => this.router.navigate(['/incidents', this.id()]),
      error: () => undefined,
    });
    this.incidentService
      .update(this.id(), value)
      // Igual que en el alta: sin esto se navegaría desde un componente ya
      // destruido si el usuario se marcha mientras se guarda.
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/incidents', this.id()]),
        error: () => undefined,
      });
  }

  protected onCancelled(): void {
    this.router.navigate(['/incidents', this.id()]);
  }
}