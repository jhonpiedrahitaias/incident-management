import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state message="No hay incidencias registradas." hint="Aparecerán aquí.">
      <button type="button" id="projected-action">Registrar</button>
    </app-empty-state>
  `,
})
class HostComponent {}

describe('Estado vacío', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('Debería crear', () => {
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('Muestra el mensaje y la aclaración', () => {
    expect(fixture.nativeElement.querySelector('.empty-state-message').textContent).toContain(
      'No hay incidencias registradas.',
    );
    expect(fixture.nativeElement.querySelector('.empty-state-hint').textContent).toContain(
      'Aparecerán aquí.',
    );
  });

  it('Proyecta la acción opcional', () => {
    expect(fixture.nativeElement.querySelector('#projected-action')).toBeTruthy();
  });
});

@Component({
  imports: [EmptyState],
  template: `<app-empty-state message="Sin resultados." />`,
})
class MinimalHostComponent {}

describe('EmptyState sin aclaración ni acción', () => {
  it('No deja rastro de lo que no se le pasa', async () => {
    await TestBed.configureTestingModule({ imports: [MinimalHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MinimalHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state-hint')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('Sin resultados.');
  });
});