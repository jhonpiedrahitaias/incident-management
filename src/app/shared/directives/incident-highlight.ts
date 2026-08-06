import { Directive, computed, input } from '@angular/core';
import { IncidentPriority } from '../../core/models/incident.model';

@Directive({
  selector: '[appIncidentHighlight]',
  host: {
    // Host bindings: la clase se pone y se quita sola según la señal.
    '[class.is-critical]': 'isCritical()',
    '[attr.data-priority]': 'priority()',
    // Solo las críticas se anuncian; el resto no debe interrumpir al usuario.
    '[attr.aria-current]': 'isCritical() ? "true" : null',
  },
})
export class IncidentHighlight {
  /**
   * Prioridad a evaluar. El input se llama igual que el selector para poder
   * escribir `[appIncidentHighlight]="incident.priority"` en vez de repetir
   * el atributo dos veces.
   */
  readonly priority = input.required<IncidentPriority | string | null | undefined>({
    alias: 'appIncidentHighlight',
  });

  protected readonly isCritical = computed(() => this.priority() === 'CRITICAL');
}