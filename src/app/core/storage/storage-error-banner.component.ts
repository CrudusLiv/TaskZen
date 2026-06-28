import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StorageErrorService } from './storage-error.service';

@Component({
  selector: 'app-storage-error-banner',
  standalone: true,
  template: `@if (svc.loadFailed()) {
    <div class="storage-error-banner" role="alert" aria-live="assertive">
      <span>Couldn't load your saved data. Your tasks may not appear — try refreshing.</span>
      <button type="button" (click)="refresh()">Refresh</button>
      <button type="button" class="dismiss" (click)="svc.dismiss()" aria-label="Dismiss notice">
        ×
      </button>
    </div>
    }`,
  styles: [
    `
      .storage-error-banner {
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
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        font-size: 0.9rem;
        z-index: 2000;
        max-width: 90vw;
      }
    `,
    `
      .storage-error-banner button {
        background: #5a1010;
        color: #fff;
        border: none;
        padding: 0.35rem 0.6rem;
        border-radius: 0.3rem;
        cursor: pointer;
        flex-shrink: 0;
      }
    `,
    `
      .storage-error-banner button:hover {
        background: #7a2020;
      }
    `,
    `
      .storage-error-banner .dismiss {
        background: transparent;
        font-weight: bold;
        font-size: 1rem;
        padding: 0 0.4rem;
      }
    `,
  ],
})
export class StorageErrorBannerComponent {
  readonly svc = inject(StorageErrorService);
  private readonly doc = inject(DOCUMENT);

  refresh(): void {
    this.doc.location.reload();
  }
}
