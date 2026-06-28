import { Component, signal, inject, OnDestroy } from '@angular/core';
import { NgIf, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { FocusActions } from './state/focus.actions';
import { selectCurrentFocus, selectOnBreak, selectSessionExpired, selectHyperfocusWarning, selectWhereWasI } from './state/focus.selectors';
import { selectItemsArray } from '../items/state/items.selectors';
import { PreferencesState } from '../preferences/state/preferences.reducer';
import { focusFeatureKey } from './state/focus.reducer';

@Component({
  standalone: true,
  selector: 'app-focus-page',
  imports: [NgIf, NgFor, AsyncPipe, DecimalPipe],
  templateUrl: './focus.page.html',
  styleUrls: ['./focus.page.scss'],
})
export class FocusPage implements OnDestroy {
  private store = inject(Store);
  durations = [15, 25, 45];
  choosing = signal(true);
  pickedDuration = signal<number>(25);
  pickedItemId = signal<string | undefined>(undefined);
  nudgeDismissed = signal(false);
  hyperfocusDismissed = signal(false);
  current$ = this.store.select(selectCurrentFocus);
  onBreak$ = this.store.select(selectOnBreak);
  sessionExpired$ = this.store.select(selectSessionExpired);
  hyperfocusWarning$ = this.store.select(selectHyperfocusWarning);
  items$ = this.store.select(selectItemsArray);
  whereWasI$ = this.store.select(selectWhereWasI);
  private timer?: number;

  startSession() {
    this.store.dispatch(
      FocusActions.startSession({
        itemId: this.pickedItemId(),
        plannedMinutes: this.pickedDuration(),
        calmSnapshot: false,
      })
    );
    this.choosing.set(false);
    this.nudgeDismissed.set(false);
    this.hyperfocusDismissed.set(false);
    this.startTick();
  }
  startBreak() {
    this.store.dispatch(FocusActions.startBreak());
    this.stopTick();
    this.nudgeDismissed.set(false);
    this.hyperfocusDismissed.set(false);
  }
  endBreak() {
    this.store.dispatch(FocusActions.endBreak());
    this.startTick();
  }
  dismissNudge() {
    this.nudgeDismissed.set(true);
  }
  dismissHyperfocus() { this.hyperfocusDismissed.set(true); }
  onDurationChange(v: string) {
    const num = Number(v);
    if (!isNaN(num)) this.pickedDuration.set(num);
  }
  onItemChange(v: string) {
    this.pickedItemId.set(v || undefined);
  }
  private startTick() {
    this.stopTick();
    this.timer = window.setInterval(() => this.store.dispatch(FocusActions.tick()), 1000);
  }
  pause() {
    this.store.dispatch(FocusActions.pause());
    this.stopTick();
  }
  resume() {
    this.store.dispatch(FocusActions.resume());
    this.startTick();
  }
  stop() {
    this.store.dispatch(FocusActions.stop());
    this.stopTick();
    this.choosing.set(true);
    this.nudgeDismissed.set(false);
    this.hyperfocusDismissed.set(false);
  }
  abort() {
    this.store.dispatch(FocusActions.abort());
    this.stopTick();
    this.choosing.set(true);
    this.nudgeDismissed.set(false);
    this.hyperfocusDismissed.set(false);
  }
  async complete() {
    this.store.dispatch(FocusActions.complete());
    this.stopTick();
    this.choosing.set(true);
    this.nudgeDismissed.set(false);
    this.hyperfocusDismissed.set(false);
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {
      // confetti is non-critical; swallow errors silently
    }
  }
  private stopTick() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
  ngOnDestroy() {
    this.stopTick();
  }
  progressPct(current: { tickSeconds: number; plannedMinutes: number } | undefined) {
    if (!current) return 0;
    return Math.min(100, (current.tickSeconds / (current.plannedMinutes * 60)) * 100);
  }
}
