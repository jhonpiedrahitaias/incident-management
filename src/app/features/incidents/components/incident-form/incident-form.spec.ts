//IA
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentForm, IncidentFormValue } from './incident-form';
import { IncidentPriorityEnum } from '../../../../core/domain/models/incident.model';

const VALID = {
  title: 'Fuga en el aire acondicionado',
  description: 'Gotea sobre los equipos del rack principal.',
  category: 'Infraestructura',
  priority: IncidentPriorityEnum.HIGH,
};

describe('IncidentForm', () => {
  let component: IncidentForm;
  let fixture: ComponentFixture<IncidentForm>;
  let emitted: IncidentFormValue[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentForm],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentForm);
    component = fixture.componentInstance;

    emitted = [];
    component.submitted.subscribe((value) => emitted.push(value));

    fixture.detectChanges();
  });

  it('Debería crear', () => {
    expect(component).toBeTruthy();
  });

  describe('Estado inicial', () => {
    it('Arranca vacío y con el envío deshabilitado', () => {
      expect(submitButton().disabled).toBe(true);
      expect(field('#incident-title').value).toBe('');
    });

    it('No muestra ningún error antes de interactuar', () => {
      expect(errors().length).toBe(0);
    });
  });

  describe('Validación', () => {
    it('Muestra el error solo después de que el usuario toque el campo', () => {
      expect(errorFor('incident-title')).toBeNull();

      touch('#incident-title');

      expect(errorFor('incident-title')?.textContent).toContain('obligatorio');
    });

    it('Exige una longitud mínima en el título', () => {
      type_('#incident-title', 'abc');
      touch('#incident-title');

      expect(errorFor('incident-title')?.textContent).toContain('al menos 5 caracteres');
    });

    it('Exige una longitud mínima en la descripción', () => {
      type_('#incident-description', 'corto');
      touch('#incident-description');

      expect(errorFor('incident-description')?.textContent).toContain('al menos 10 caracteres');
    });

    it('Rechaza títulos demasiado largos', () => {
      type_('#incident-title', 'a'.repeat(101));
      touch('#incident-title');

      expect(errorFor('incident-title')?.textContent).toContain('No puede superar los 100');
      expect(submitButton().disabled).toBe(true);
    });

    it('Marca el campo inválido con aria-invalid y lo asocia a su mensaje', () => {
      touch('#incident-title');

      const input = field('#incident-title');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('incident-title-error');
      expect(errorFor('incident-title')?.id).toBe('incident-title-error');
    });

    it('El envío sigue deshabilitado mientras falte cualquier campo', () => {
      fillValidForm();
      expect(submitButton().disabled).toBe(false);

      type_('#incident-category', '');
      expect(submitButton().disabled).toBe(true);
    });
  });

  describe('Envío', () => {
    it('No emite nada si el formulario es inválido', () => {
      submit();

      expect(emitted.length).toBe(0);
    });

    it('Al intentar enviar vacío, revela los errores de todos los campos', () => {
      submit();

      expect(errors().length).toBe(4);
    });

    it('Emite los valores cuando el formulario es válido', () => {
      fillValidForm();

      submit();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toEqual({
        title: VALID.title,
        description: VALID.description,
        category: VALID.category,
        priority: VALID.priority as IncidentPriorityEnum,
        tags: [],
      });
    });

    it('Recorta los espacios sobrantes antes de emitir', () => {
      fillValidForm();
      type_('#incident-title', `   ${VALID.title}   `);

      submit();

      expect(emitted[0].title).toBe(VALID.title);
    });

    it('Limpia el formulario tras un registro correcto', () => {
      fillValidForm();

      submit();

      expect(field('#incident-title').value).toBe('');
      expect(field('#incident-description').value).toBe('');
      expect(submitButton().disabled).toBe(true);
    });

    it('No muestra errores en el formulario recién limpiado', () => {
      fillValidForm();

      submit();

      expect(errors().length).toBe(0);
    });

    it('Confirma el registro con un mensaje anunciable', () => {
      fillValidForm();

      submit();

      const status: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
      expect(status.textContent).toContain(VALID.title);
    });

    it('Permite registrar dos incidencias seguidas', () => {
      fillValidForm();
      submit();

      fillValidForm();
      // Ojo con el título: «prueba» es una palabra restringida.
      type_('#incident-title', 'Segunda incidencia registrada');
      submit();

      expect(emitted.length).toBe(2);
      expect(emitted[1].title).toBe('Segunda incidencia registrada');
    });
  });

  describe('Limpiar', () => {
    it('vacía los campos sin emitir nada', () => {
      fillValidForm();

      clickButton('Limpiar');

      expect(field('#incident-title').value).toBe('');
      expect(emitted.length).toBe(0);
    });

    it('Al dar de alta la acción se llama Limpiar', () => {
      expect(clickableLabels()).toContain('Limpiar');
      expect(clickableLabels()).not.toContain('Restablecer');
    });
  });

  describe('Cancelar', () => {
    it('Ofrece un botón de cancelar', () => {
      expect(clickableLabels()).toContain('Cancelar');
    });

    it('Emite el evento sin enviar el formulario', () => {
      let cancelledTimes = 0;
      component.cancelled.subscribe(() => cancelledTimes++);
      fillValidForm();

      clickButton('Cancelar');

      expect(cancelledTimes).toBe(1);
      expect(emitted.length).toBe(0);
    });

    it('Cancela también con el formulario inválido o a medias', () => {
      let cancelledTimes = 0;
      component.cancelled.subscribe(() => cancelledTimes++);
      type_('#incident-title', 'abc');

      clickButton('Cancelar');

      expect(cancelledTimes).toBe(1);
    });

    it('No es de tipo submit: no dispara el envío', () => {
      const cancel = Array.from<HTMLButtonElement>(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b) => b.textContent?.trim() === 'Cancelar')!;

      expect(cancel.type).toBe('button');
    });
  });

  function clickableLabels(): string[] {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).map(
      (button) => button.textContent?.trim() ?? '',
    );
  }


  // --- utilidades ----------------------------------------------------------

  function field(selector: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function type_(selector: string, value: string): void {
    const input = field(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function choose(selector: string, value: string): void {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function touch(selector: string): void {
    field(selector).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    type_('#incident-title', VALID.title);
    type_('#incident-description', VALID.description);
    type_('#incident-category', VALID.category);
    choose('#incident-priority', VALID.priority);
  }

  function submit(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]');
  }

  function clickButton(label: string): void {
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    );
    buttons.find((b) => b.textContent?.trim() === label)?.click();
    fixture.detectChanges();
  }

  function errors(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.incident-form-error'));
  }

  function errorFor(fieldId: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`#${fieldId}-error`);
  }
});