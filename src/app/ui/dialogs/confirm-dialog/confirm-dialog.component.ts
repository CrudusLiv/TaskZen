import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_CLOSE, DIALOG_DATA, DialogCloseFn } from '../services/dialog.tokens';

type ConfirmData = { title?: string; message?: string; confirmText?: string; cancelText?: string };

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  data = (inject(DIALOG_DATA, { optional: true }) as ConfirmData) || {};
  private closeRef = inject<DialogCloseFn<boolean>>(DIALOG_CLOSE, { optional: true });
  yes(){ this.closeRef?.(true); }
  no(){ this.closeRef?.(false); }
}
