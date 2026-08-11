import { Directive, ElementRef, inject, signal } from '@angular/core';


@Directive({
  selector: '[appFocusWithin]',
  host: {
    '[class.has-focus-within]': 'hasFocusWithin()',
    // Host listeners. Se usan focusin/focusout —y no focus/blur— porque
    // estos sí se propagan desde los descendientes hasta el host.
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class FocusWithin {

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusWithin = signal(false);

  /** `true` mientras el foco esté dentro del elemento. */
  readonly hasFocusWithin = this.focusWithin.asReadonly();

  protected onFocusIn(): void {
    this.focusWithin.set(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;

    const stillInside =
      nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget);

    this.focusWithin.set(stillInside);
  }
}