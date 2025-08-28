import { Injectable, signal, effect } from '@angular/core';

/** Manages runtime theme tokens (board accent, density, mode, contrast). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Signals for dynamic theming
  readonly accent = signal<string>('#7c3aed');
  readonly mode = signal<'dark'|'light'>('dark');
  readonly density = signal<'comfortable'|'compact'>('comfortable');
  readonly highContrast = signal(false);

  constructor(){
    // Initial load: attempt restore from localStorage, else system preference
    try {
      const stored = localStorage.getItem('tz.theme');
      let initial: 'dark'|'light'|undefined = stored==='dark' || stored==='light' ? stored as any : undefined;
      if(!initial){
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initial = prefersDark ? 'dark' : 'light';
      }
      this.setMode(initial);
      const acc = localStorage.getItem('tz.accent');
      if(acc) this.setAccent(acc);
    } catch {}

    // Persist changes reactively
    effect(()=>{
      const m = this.mode();
      try { localStorage.setItem('tz.theme', m); } catch {}
    });
    effect(()=>{
      const a = this.accent();
      this.applyVar('--board-accent', a);
      try { localStorage.setItem('tz.accent', a); } catch {}
    });
  }

  setAccent(color?: string){ if(color) { this.accent.set(color); } }
  setMode(m: 'dark'|'light'){ this.mode.set(m); document.documentElement.dataset['theme'] = m; }
  toggleMode(){ this.setMode(this.mode()==='dark'?'light':'dark'); }
  setDensity(d: 'comfortable'|'compact'){ this.density.set(d); document.documentElement.dataset['density'] = d; }
  toggleDensity(){ this.setDensity(this.density()==='comfortable'?'compact':'comfortable'); }
  setHighContrast(on: boolean){ this.highContrast.set(on); document.documentElement.dataset['contrast'] = on ? 'high' : 'normal'; }
  toggleHighContrast(){ this.setHighContrast(!this.highContrast()); }

  private applyVar(name: string, value: string){ document.documentElement.style.setProperty(name, value); }
}
