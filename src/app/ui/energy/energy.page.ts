import { Component, signal, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { EnergyActions, EnergyLog } from './state/energy.actions';
import {
  selectEnergyLogs,
  selectLatestEnergy,
  selectAverageEnergy,
} from './state/energy.selectors';

@Component({
  standalone: true,
  selector: 'app-energy-page',
  imports: [],
  templateUrl: './energy.page.html',
  styleUrls: ['./energy.page.scss'],
})
export class EnergyPage {
  private store = inject(Store<{ energy: { logs: EnergyLog[] } }>);
  logsSig = this.store.selectSignal(selectEnergyLogs);
  latestSig = this.store.selectSignal(selectLatestEnergy);
  avgSig = this.store.selectSignal(selectAverageEnergy);

  level = signal<1 | 2 | 3 | 4 | 5>(3);
  moods = signal<string[]>([]);
  note = signal('');
  moodPalette = ['focused', 'calm', 'stressed', 'distracted', 'sleepy', 'energized', 'foggy'];

  setLevel(l: number) {
    if (l >= 1 && l <= 5) this.level.set(l as 1 | 2 | 3 | 4 | 5);
  }
  toggleMood(m: string) {
    this.moods.update((arr) => (arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]));
  }
  add() {
    this.store.dispatch(
      EnergyActions.addLog({
        level: this.level(),
        moods: this.moods(),
        note: this.note().trim() || undefined,
      }),
    );
    this.moods.set([]);
    this.note.set('');
  }
  remove(id: string) {
    this.store.dispatch(EnergyActions.deleteLog({ id }));
  }
  rel(ts: string) {
    const diff = Date.now() - Date.parse(ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const h = Math.floor(mins / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    return d + 'd ago';
  }
  levelClass(l: number) {
    return 'lvl lvl-' + l;
  }
}
