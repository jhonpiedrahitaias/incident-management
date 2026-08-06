import { Directive, ElementRef, inject, signal } from '@angular/core';

@Directive({
  selector: '[appFocusWithin]',
  host: {
    '[class.has-focus-within]': 'hasFocusWithin()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class FocusWithin {

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusWithin = signal(false);

  /** `true` mientras el foco esté dentro del elemento. */
  readonly hasFocusWithin = this.focusWithin.asReadonly();

   onFocusIn(): void {
    this.focusWithin.set(true);
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;

    const stillInside =
      nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget);

    this.focusWithin.set(stillInside);
  }
}