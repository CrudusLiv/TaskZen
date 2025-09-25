import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectRoutinesArray } from '../state/routines.selectors';

@Component({
  standalone: true,
  selector: 'app-routine-play-page',
  imports: [CommonModule],
  templateUrl: './routine-play.page.html',
  styleUrls: ['./routine-play.page.scss']
})
export class RoutinePlayPage {
  private store = inject(Store);
  routinesSig = this.store.selectSignal(selectRoutinesArray);
  // For MVP shell, pick first routine if any. Later this will read route param.
  activeRoutine = computed(() => this.routinesSig()[0]);
  currentIndex = signal(0);
  paused = signal(false);
  started = signal(false);

  constructor() {}

  start() { this.started.set(true); this.currentIndex.set(0); this.paused.set(false); }
  next() { const r = this.activeRoutine(); if(!r) return; if(this.currentIndex() < r.steps.length - 1) this.currentIndex.update(i=>i+1); }
  prev() { if(this.currentIndex() > 0) this.currentIndex.update(i=>i-1); }
  togglePause() { this.paused.update(p=>!p); }
  stop() { this.started.set(false); this.currentIndex.set(0); this.paused.set(false); }
  progressPct() { const r = this.activeRoutine(); if(!r || !r.steps.length) return 0; return ((this.currentIndex()) / r.steps.length) * 100; }
}
