import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toast-container" role="status" aria-live="polite">
    @for (t of toasts(); track t.id) {
      <div class="toast" [class.error]="t.type==='error'" [class.success]="t.type==='success'">
        <span>{{ t.text }}</span>
        <button type="button" class="close" (click)="dismiss(t.id)" aria-label="Dismiss">×</button>
      </div>
    }
  </div>
  `,
  styles: [`
    .toast-container{ position:fixed; bottom:1rem; right:1rem; display:flex; flex-direction:column; gap:.5rem; z-index:1000; }
    .toast{ background:#1f2937; color:#f1f5f9; padding:.6rem .9rem; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,.4); display:flex; align-items:center; gap:.75rem; font-size:.875rem; border:1px solid rgba(255,255,255,.08); }
    .toast.success{ border-color:#10b981; }
    .toast.error{ border-color:#ef4444; }
    .toast .close{ background:transparent; color:inherit; border:none; cursor:pointer; font-size:1rem; line-height:1; }
    .toast .close:focus{ outline:2px solid var(--accent,#6366f1); outline-offset:2px; }
  `]
})
export class ToastContainerComponent {
  private svc = inject(ToastService);
  toasts = this.svc.messages;
  dismiss(id: string){ this.svc.dismiss(id); }
}
