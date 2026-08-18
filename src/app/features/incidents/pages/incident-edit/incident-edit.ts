import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IncidentForm, IncidentFormValue } from '../../components/incident-form/incident-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IncidentStore } from '../../../../core/state/incident-store';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-incident-edit',
  imports: [
    IncidentForm, 
    RouterLink,
    LoadingIndicator
  ],
  templateUrl: './incident-edit.html',
  styleUrl: './incident-edit.scss',
})
export class IncidentEdit {
  private readonly store = inject(IncidentStore);
  private readonly router = inject(Router);
  readonly id = input.required<string>();
  private readonly destroyRef = inject(DestroyRef);
  protected readonly incident = computed(() => this.store.getById(this.id()));
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;

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
    this.store.update(this.id(), value).subscribe({
      next: () => this.router.navigate(['/incidents', this.id()]),
      error: () => undefined,
    });
    this.store
      .update(this.id(), value)
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