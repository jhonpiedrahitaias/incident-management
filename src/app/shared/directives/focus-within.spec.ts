import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusWithin } from './focus-within';

@Component({
  imports: [FocusWithin],
  template: `
    <div id="panel" appFocusWithin>
      <button id="inside-a" type="button">A</button>
      <button id="inside-b" type="button">B</button>
    </div>
    <button id="outside" type="button">Fuera</button>
  `,
})
class HostComponent {}

describe('FocusWithin', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('Debería crear an instance', () => {
    expect(panel()).toBeTruthy();
  });

  it('No marca nada mientras el foco está fuera', () => {
    expect(panel().classList).not.toContain('has-focus-within');
  });
  
  it('quita la marca cuando el foco se pierde sin destino (relatedTarget nulo)', () => {
    element('inside-a').focus();
    fixture.detectChanges();

    panel().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();

    expect(panel().classList).not.toContain('has-focus-within');
  });

  function panel(): HTMLElement {
    return element('panel');
  }

  function element(id: string): HTMLElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }
});