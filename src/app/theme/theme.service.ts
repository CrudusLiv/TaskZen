import { Injectable, signal, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectAccent,
  selectDensity,
  selectHighContrast,
  selectThemeMode,
  selectCalmMode,
} from '../ui/preferences/state/preferences.selectors';

/** Manages runtime theme tokens (board accent, density, mode, contrast). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Signals for dynamic theming
  readonly accent = signal<string>('#7c3aed');
  // Dark mode is the only mode now; keep a signal for compatibility if needed by components
  readonly mode = signal<'dark'>('dark');
  readonly density = signal<'comfortable' | 'compact'>('comfortable');
  readonly highContrast = signal(false);

  private store = inject(Store);

  constructor() {
    // Initial load: attempt restore from localStorage, else system preference
    try {
      const acc = localStorage.getItem('tz.accent');
      if (acc) this.setAccent(acc);
    } catch {
      /* localStorage unavailable (e.g. private browsing) */
    }

    // Always enforce (initial) dark theme dataset until store hydration overrides
    document.documentElement.dataset['theme'] = 'dark';

    // Accent reactive application
    effect(() => {
      const accent = this.store.selectSignal(selectAccent)();
      if (accent) {
        this.accent.set(accent);
        try {
          localStorage.setItem('tz.accent', accent);
        } catch {
          /* localStorage unavailable */
        }
      }
      this.applyVar('--board-accent', this.accent());
    });

    // Theme mode (dark / light future)
    effect(() => {
      const mode = this.store.selectSignal(selectThemeMode)();
      if (mode) document.documentElement.dataset['theme'] = mode;
    });

    // Density
    effect(() => {
      const density = this.store.selectSignal(selectDensity)();
      if (density) document.documentElement.dataset['density'] = density;
    });

    // High contrast
    effect(() => {
      const hc = this.store.selectSignal(selectHighContrast)();
      document.documentElement.classList.toggle('high-contrast', !!hc);
      document.documentElement.dataset['contrast'] = hc ? 'high' : 'normal';
    });

    // Calm mode (reduced saturation / motion)
    effect(() => {
      const calm = this.store.selectSignal(selectCalmMode)();
      document.documentElement.classList.toggle('calm-mode', !!calm);
    });
  }

  setAccent(color?: string) {
    if (color) {
      this.accent.set(color);
    }
  }
  // setMode / toggleMode are deprecated; no-ops retained for backward compatibility
  setMode() {
    /* dark only — mode parameter removed; dark is the only supported mode */
    this.mode.set('dark');
    document.documentElement.dataset['theme'] = 'dark';
  }
  toggleMode() {
    /* dark only */ this.setMode();
  }
  setDensity(d: 'comfortable' | 'compact') {
    this.density.set(d);
    document.documentElement.dataset['density'] = d;
  }
  toggleDensity() {
    this.setDensity(this.density() === 'comfortable' ? 'compact' : 'comfortable');
  }
  setHighContrast(on: boolean) {
    this.highContrast.set(on);
    document.documentElement.dataset['contrast'] = on ? 'high' : 'normal';
  }
  toggleHighContrast() {
    this.setHighContrast(!this.highContrast());
  }

  private applyVar(name: string, value: string) {
    document.documentElement.style.setProperty(name, value);
  }
}
