import { Component, inject } from '@angular/core';
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
@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [CommonModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  private store = inject(Store);

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
}
