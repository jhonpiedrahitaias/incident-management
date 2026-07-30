import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() systemTitle = '';
  @Input() userName = '';

  protected readonly showUserDetails = signal(true);

  toggleUserDetails(): void {
    this.showUserDetails.update((visible) => !visible);
  }
}