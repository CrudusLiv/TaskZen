import { Injectable, signal } from '@angular/core';

/** Manages runtime theme tokens (board accent, density, mode, contrast). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Signals for dynamic theming
  readonly accent = signal<string>('#7c3aed');
  readonly mode = signal<'dark'|'light'>('dark');
  readonly density = signal<'comfortable'|'compact'>('comfortable');
  readonly highContrast = signal(false);

  setAccent(color?: string){ if(color) { this.accent.set(color); this.applyVar('--board-accent', color); } }
  setMode(m: 'dark'|'light'){ this.mode.set(m); document.documentElement.dataset['theme'] = m; }
  toggleMode(){ this.setMode(this.mode()==='dark'?'light':'dark'); }
  setDensity(d: 'comfortable'|'compact'){ this.density.set(d); document.documentElement.dataset['density'] = d; }
  toggleDensity(){ this.setDensity(this.density()==='comfortable'?'compact':'comfortable'); }
  setHighContrast(on: boolean){ this.highContrast.set(on); document.documentElement.dataset['contrast'] = on ? 'high' : 'normal'; }
  toggleHighContrast(){ this.setHighContrast(!this.highContrast()); }

  private applyVar(name: string, value: string){ document.documentElement.style.setProperty(name, value); }
}
