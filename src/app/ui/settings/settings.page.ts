import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { PreferencesActions } from '../preferences/state/preferences.actions';
import {
  selectCalmMode,
  selectThemeMode,
  selectAccent,
  selectDensity,
  selectHighContrast,
} from '../preferences/state/preferences.selectors';
import { EncryptedStorageService } from '../../core/storage/encrypted-storage.service';
@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  private store = inject(Store);
  private storage = inject(EncryptedStorageService);

  exportStatus = signal<string | null>(null);

  calm = this.store.selectSignal(selectCalmMode);
  themeMode = this.store.selectSignal(selectThemeMode);
  accent = this.store.selectSignal(selectAccent);
  density = this.store.selectSignal(selectDensity);
  highContrast = this.store.selectSignal(selectHighContrast);
  accentPalette = [
    '#7c3aed',
    '#6366f1',
    '#4f46e5',
    '#0ea5e9',
    '#10b981',
    '#14b8a6',
    '#ef4444',
    '#f59e0b',
    '#f472b6',
  ];

  toggleCalm() {
    this.store.dispatch(PreferencesActions.toggleCalmMode());
  }
  setThemeMode(mode: any) {
    this.store.dispatch(PreferencesActions.setThemeMode({ mode }));
  }
  setAccent(accent: string) {
    this.store.dispatch(PreferencesActions.setAccent({ accent }));
  }
  setDensity(density: any) {
    this.store.dispatch(PreferencesActions.setDensity({ density }));
  }
  setHighContrast(value: boolean) {
    this.store.dispatch(PreferencesActions.setHighContrast({ value }));
  }

  async exportData(): Promise<void> {
    try {
      const data = await this.storage.export();
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskzen-backup-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.exportStatus.set('Exported successfully!');
      setTimeout(() => this.exportStatus.set(null), 3000);
    } catch {
      this.exportStatus.set('Export failed — try again.');
      setTimeout(() => this.exportStatus.set(null), 4000);
    }
  }

  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await this.storage.import(text.trim());
      this.exportStatus.set('Import successful! Refresh to see your data.');
      setTimeout(() => this.exportStatus.set(null), 5000);
    } catch {
      this.exportStatus.set('Import failed — file may be invalid or from a different device.');
      setTimeout(() => this.exportStatus.set(null), 5000);
    } finally {
      input.value = '';
    }
  }
}
