import { Component, computed, signal, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectRoutineById } from '../state/routines.selectors';

@Component({
  standalone: true,
  selector: 'app-routine-play-page',
  imports: [CommonModule],
  templateUrl: './routine-play.page.html',
  styleUrls: ['./routine-play.page.scss'],
})
export class RoutinePlayPage implements OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private routineId = this.route.snapshot.paramMap.get('id') ?? '';

  activeRoutine = this.store.selectSignal(selectRoutineById(this.routineId));

  currentIndex = signal(0);
  started = signal(false);
  completed = signal(false);

  /** Remaining seconds for the current step */
  secondsLeft = signal(0);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // If no routine found after store resolves, navigate back
    effect(() => {
      if (this.routineId && this.activeRoutine() === null) {
        this.router.navigate(['/routines']);
      }
    });
  }

  // ── Computed helpers ─────────────────────────────────────────────────────

  currentStep = computed(() => {
    const r = this.activeRoutine();
    if (!r || !r.steps.length) return null;
    return r.steps[this.currentIndex()] ?? null;
  });

  progressPct = computed(() => {
    const r = this.activeRoutine();
    if (!r || !r.steps.length) return 0;
    return (this.currentIndex() / r.steps.length) * 100;
  });

  timerDisplay = computed(() => {
    const s = this.secondsLeft();
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  });

  isLastStep = computed(() => {
    const r = this.activeRoutine();
    if (!r) return false;
    return this.currentIndex() === r.steps.length - 1;
  });

  // ── Timer helpers ─────────────────────────────────────────────────────────

  private stepDurationSeconds(): number {
    const step = this.currentStep();
    if (!step || !step.minutes) return 0;
    return step.minutes * 60;
  }

  private startTimer(): void {
    this.clearTimer();
    const duration = this.stepDurationSeconds();
    if (duration <= 0) return; // no timer for steps without duration
    this.secondsLeft.set(duration);
    this.intervalId = setInterval(() => {
      const remaining = this.secondsLeft() - 1;
      if (remaining <= 0) {
        this.secondsLeft.set(0);
        this.clearTimer();
        this.advanceStep();
      } else {
        this.secondsLeft.set(remaining);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private advanceStep(): void {
    const r = this.activeRoutine();
    if (!r) return;
    if (this.currentIndex() < r.steps.length - 1) {
      this.currentIndex.update((i) => i + 1);
      this.startTimer();
    } else {
      this.completed.set(true);
      this.started.set(false);
    }
  }

  // ── Public controls ───────────────────────────────────────────────────────

  start(): void {
    const r = this.activeRoutine();
    if (!r || !r.steps.length) return;
    this.currentIndex.set(0);
    this.completed.set(false);
    this.started.set(true);
    this.startTimer();
  }

  next(): void {
    this.clearTimer();
    this.advanceStep();
  }

  stop(): void {
    this.clearTimer();
    this.started.set(false);
    this.completed.set(false);
    this.currentIndex.set(0);
    this.secondsLeft.set(0);
  }

  backToRoutines(): void {
    this.stop();
    this.router.navigate(['/routines']);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}
