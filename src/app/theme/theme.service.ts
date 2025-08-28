import { Injectable, signal, effect } from '@angular/core';

/** Manages runtime theme tokens (board accent, density, mode, contrast). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Signals for dynamic theming
  readonly accent = signal<string>('#7c3aed');
  // Dark mode is the only mode now; keep a signal for compatibility if needed by components
  readonly mode = signal<'dark'>('dark');
  readonly density = signal<'comfortable'|'compact'>('comfortable');
  readonly highContrast = signal(false);

  constructor(){
    // Initial load: attempt restore from localStorage, else system preference
    try {
      const acc = localStorage.getItem('tz.accent');
      if(acc) this.setAccent(acc);
    } catch {}

    // Always enforce dark theme dataset
    document.documentElement.dataset['theme'] = 'dark';
    effect(()=>{
      const a = this.accent();
      this.applyVar('--board-accent', a);
      try { localStorage.setItem('tz.accent', a); } catch {}
    });
  }

  setAccent(color?: string){ if(color) { this.accent.set(color); } }
  // setMode / toggleMode are deprecated; no-ops retained for backward compatibility
  setMode(_m: 'dark'|'light'|'dark'){ /* dark only */ this.mode.set('dark'); document.documentElement.dataset['theme']='dark'; }
  toggleMode(){ /* dark only */ this.setMode('dark'); }
  setDensity(d: 'comfortable'|'compact'){ this.density.set(d); document.documentElement.dataset['density'] = d; }
  toggleDensity(){ this.setDensity(this.density()==='comfortable'?'compact':'comfortable'); }
  setHighContrast(on: boolean){ this.highContrast.set(on); document.documentElement.dataset['contrast'] = on ? 'high' : 'normal'; }
  toggleHighContrast(){ this.setHighContrast(!this.highContrast()); }

  private applyVar(name: string, value: string){ document.documentElement.style.setProperty(name, value); }
}
