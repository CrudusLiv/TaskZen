import { Component, inject } from '@angular/core';
import { UpdateNotifierService } from './update-notifier.service';

@Component({
  selector: 'app-update-banner',
  standalone: true,
  template: `@if (svc.updateAvailable()) {
    <div class="update-banner" role="status" aria-live="polite">
      <span>New version available.</span>
      <button type="button" (click)="reload()">Refresh</button>
      <button type="button" class="dismiss" (click)="dismiss()" aria-label="Dismiss update notice">
        ×
      </button>
    </div>
  }`,
  styles: [
    `
      .update-banner {
        position: fixed;
        left: 50%;
        top: 0;
        transform: translateX(-50%);
        background: #222;
        color: #fff;
        padding: 0.5rem 0.75rem;
        border-radius: 0 0 0.5rem 0.5rem;
        display: flex;
        gap: 0.75rem;
        align-items: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        font-size: 0.9rem;
        z-index: 2000;
      }
    `,
    `
      .update-banner button {
        background: #444;
        color: #fff;
        border: none;
        padding: 0.35rem 0.6rem;
        border-radius: 0.3rem;
        cursor: pointer;
      }
    `,
    `
      .update-banner button:hover {
        background: #666;
      }
    `,
    `
      .update-banner .dismiss {
        background: transparent;
        font-weight: bold;
        font-size: 1rem;
        padding: 0 0.4rem;
      }
    `,
  ],
})
export class UpdateBannerComponent {
  readonly svc = inject(UpdateNotifierService);
  private dismissed = false;
  constructor() {
    // start polling lazily when component mounts
    this.svc.start();
  }
  reload() {
    location.reload();
  }
  dismiss() {
    this.dismissed = true;
    this.svc.updateAvailable.set(false);
  }
}
