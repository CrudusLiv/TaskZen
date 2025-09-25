import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { PreferencesActions } from '../preferences/state/preferences.actions';
import {
  selectAccent,
  selectCalmMode,
  selectDensity,
  selectHighContrast,
  selectThemeMode,
} from '../preferences/state/preferences.selectors';

@Component({
  standalone: true,
  selector: 'app-preferences-panel',
  imports: [CommonModule],
  template: `
    <form class="prefs panel-glass panel-section" (submit)="$event.preventDefault()">
      <fieldset class="group">
        <legend>Interface</legend>
        <label class="inline">
          <input type="checkbox" [checked]="calm()" (change)="toggleCalm()" /> Calm mode
        </label>
        <label>
          <span>Theme Mode</span>
          <select [value]="themeMode()" (change)="setThemeMode($any($event.target).value)">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </label>
        <label>
          <span>Accent</span>
          <input
            type="color"
            [value]="accent() || '#7c3aed'"
            (input)="setAccent($any($event.target).value)"
          />
        </label>
        <label>
          <span>Density</span>
          <select [value]="density()" (change)="setDensity($any($event.target).value)">
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <label>
          <span>Contrast</span>
          <select
            [value]="highContrast() ? 'high' : 'standard'"
            (change)="setHighContrast($any($event.target).value === 'high')"
          >
            <option value="standard">Standard</option>
            <option value="high">High</option>
          </select>
        </label>
      </fieldset>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .prefs {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .group {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        border: none;
        margin: 0;
        padding: 0;
      }
      .group legend {
        font-size: 0.7rem;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.75;
        font-weight: 600;
        margin-bottom: 0.2rem;
      }
      .group label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.65rem;
      }
      .group label.inline {
        flex-direction: row;
        align-items: center;
      }
      select,
      input[type='color'] {
        padding: 0.4rem 0.6rem;
        background: #161c23;
        color: var(--color-text);
        border: 1px solid var(--color-border);
        border-radius: 0.5rem;
        font-size: 0.65rem;
      }
      input[type='color'] {
        height: 2rem;
      }
    `,
  ],
})
export class PreferencesPanelComponent {
  private store = inject(Store);
  calm = this.store.selectSignal(selectCalmMode);
  themeMode = this.store.selectSignal(selectThemeMode);
  accent = this.store.selectSignal(selectAccent);
  density = this.store.selectSignal(selectDensity);
  highContrast = this.store.selectSignal(selectHighContrast);

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
