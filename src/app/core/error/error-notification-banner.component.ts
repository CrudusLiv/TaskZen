import { Component, inject } from '@angular/core';
import { ErrorNotificationService } from './error-notification.service';

@Component({
  selector: 'app-error-notification-banner',
  standalone: true,
  template: `@if (svc.message()) {
    <div class="error-banner" role="alert" aria-live="assertive">
      <span>{{ svc.message() }}</span>
      <button type="button" class="dismiss" (click)="svc.dismiss()" aria-label="Dismiss error">×</button>
    </div>
  }`,
  styles: [`
    .error-banner {
      position: fixed;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
      background: #7b2020;
      color: #fff;
      padding: 0.5rem 0.75rem;
      border-radius: 0 0 0.5rem 0.5rem;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 0.9rem;
      z-index: 2001;
      max-width: 90vw;
    }
    .error-banner .dismiss {
      background: transparent;
      color: #fff;
      border: none;
      font-weight: bold;
      font-size: 1rem;
      padding: 0 0.4rem;
      cursor: pointer;
      flex-shrink: 0;
    }
  `],
})
export class ErrorNotificationBannerComponent {
  readonly svc = inject(ErrorNotificationService);
}
