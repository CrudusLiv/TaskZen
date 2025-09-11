import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_CLOSE, DIALOG_DATA, DialogCloseFn } from '../services/dialog.tokens';

type InputData = {
  title?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  confirmText?: string;
  cancelText?: string;
};

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDialogComponent {
  data = (inject(DIALOG_DATA, { optional: true }) as InputData) || {};
  val = this.data.value || '';
  private closeRef = inject<DialogCloseFn<string|undefined>>(DIALOG_CLOSE, { optional: true });

  submit() { this.closeRef?.(this.val?.trim() || undefined); }
  close() { this.closeRef?.(); }
}
