import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { IncidentDraft, IncidentPriority } from '../../../../core/models/incident.model';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export type IncidentFormValue = Omit<IncidentDraft, 'reporterId' | 'status'>;

interface IncidentFormControls {
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  priority: FormControl<IncidentPriority | ''>;
}

@Component({
  selector: 'app-incident-form',
  imports: [ReactiveFormsModule],
  templateUrl: './incident-form.component.html',
  styleUrl: './incident-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly submitted = output<IncidentFormValue>();

  protected readonly form: FormGroup<IncidentFormControls> = this.formBuilder.group({
    title: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
    }),
    description: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
    category: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: this.formBuilder.control<IncidentPriority | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly submitAttempted = signal(false);
  protected readonly lastRegisteredTitle = signal<string | null>(null);

  protected onSubmit(): void {
    this.submitAttempted.set(true);
    this.lastRegisteredTitle.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, category, priority } = this.form.getRawValue();

    this.submitted.emit({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      priority: priority as IncidentPriority,
    });

    this.lastRegisteredTitle.set(title.trim());
    this.resetForm();
  }

  protected resetForm(): void {
    this.form.reset();
    this.submitAttempted.set(false);
  }

  protected showError(field: keyof IncidentFormControls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitAttempted());
  }

  protected errorMessage(field: keyof IncidentFormControls): string {
    const control = this.form.controls[field];

    if (!control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors['minlength']) {
      const required = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${required} caracteres.`;
    }

    if (control.errors['maxlength']) {
      const required = control.errors['maxlength'].requiredLength;
      return `No puede superar los ${required} caracteres.`;
    }

    return 'El valor no es válido.';
  }
}