import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { CoachActions } from './coach.actions';
import { map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { timer } from 'rxjs';
import { selectEnergyLogs } from '../../energy/state/energy.selectors';
import { selectItemsArray, selectItemsWithPriority } from '../../items/state/items.selectors';
import { selectRoutineAdherence } from '../../insights/insights.selectors';
import { selectCurrentFocus } from '../../focus/state/focus.selectors';

@Injectable({ providedIn: 'root' })
export class CoachEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  tickEval$ = createEffect(() => timer(4000, 60000).pipe(map(() => CoachActions.evaluateRules())));

  evaluate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CoachActions.evaluateRules),
      withLatestFrom(
        this.store.select(selectEnergyLogs),
        this.store.select(selectItemsArray),
        this.store.select(selectItemsWithPriority),
        this.store.select(selectRoutineAdherence),
        this.store.select(selectCurrentFocus)
      ),
      mergeMap(([_, energy, items, prioritized, adherence, focus]) => {
        const cards = [] as any[];
        const nowIso = new Date().toISOString();

        const h = new Date().getHours();
        const isMorning = h >= 6 && h < 10;
        const isPeak = h >= 9 && h < 12;
        const isWorkHours = h >= 7 && h < 19;
        const isEvening = h >= 16 && h < 20;

        // Rule 1 — low-energy
        const latest = energy[0];
        if (latest && latest.level <= 2) {
          cards.push({
            category: 'Energy',
            title: 'Energy is low',
            body: h >= 13 && h < 15
              ? 'Post-lunch dip is common with ADHD. A 5-min walk helps more than caffeine.'
              : 'Consider a short recharge: 2–5 min movement or hydration.',
            suggestion: 'Log a reset after your break',
            ruleId: 'low-energy',
          });
        }

        // Rule 2 — energy-trend-drop
        if (energy.length >= 3 && energy[0].level < energy[1].level && energy[1].level < energy[2].level) {
          cards.push({
            category: 'Energy',
            title: 'Energy dipping',
            body: 'Your last 3 check-ins show a drop. Take a break before the dip lands hard.',
            suggestion: 'Start a 5-min break now',
            ruleId: 'energy-trend-drop',
          });
        }

        // Rule 3 — morning-intention
        if (isMorning) {
          const today = new Date().toDateString();
          const completedToday = items.filter(
            (i) => i.status === 'done' && new Date(i.updatedAt).toDateString() === today
          ).length;
          if (completedToday === 0) {
            cards.push({
              category: 'Focus',
              title: 'Morning intention',
              body: 'Name your Most Important Task for today — even one step forward counts.',
              suggestion: 'Pick your top task',
              ruleId: 'morning-intention',
            });
          }
        }

        // Rule 4 — peak-hours
        if (isPeak && latest && latest.level >= 3) {
          cards.push({
            category: 'Focus',
            title: 'Peak window open',
            body: 'Morning 9–12 is often your clearest window. Use it for your hardest task.',
            suggestion: 'Start a deep focus session',
            ruleId: 'peak-hours',
          });
        }

        // Rule 5 — micro-start (work hours only)
        if (isWorkHours && !focus && prioritized.length) {
          const top = prioritized[0];
          cards.push({
            category: 'Focus',
            title: 'Micro-start opportunity',
            body: `Take 90 seconds to advance: ${top.title}`,
            suggestion: 'Start a micro focus session',
            ruleId: 'micro-start',
          });
        }

        // Rule 6 — routine-low (morning only)
        if (isMorning && adherence.percent < 50) {
          cards.push({
            category: 'Routines',
            title: 'Routines need love',
            body: 'Low routine structure increases decision fatigue throughout the day.',
            suggestion: 'Open routines and add one micro step',
            ruleId: 'routine-low',
          });
        }

        // Rule 7 — inbox-heavy (evening only)
        if (isEvening && items.filter((i) => i.status === 'inbox').length > 10) {
          cards.push({
            category: 'Mindset',
            title: 'Evening brain dump',
            body: 'Heavy inbox by end of day signals unprocessed thoughts. Triage helps tomorrow.',
            suggestion: 'Schedule a 5-min triage block',
            ruleId: 'inbox-heavy',
          });
        }

        // De-duplicate by ruleId within last hour
        return this.store
          .select((state) => state as any)
          .pipe(
            map((root: any) => {
              const existing = (root.coach?.cards || []).filter(
                (c: any) => Date.now() - new Date(c.createdAt).getTime() < 3600_000
              );
              const newOnes = cards.filter(
                (c) => !existing.some((e: any) => e.ruleId === c.ruleId)
              );
              return newOnes.map((c) =>
                CoachActions.addCard({
                  card: {
                    id: crypto.randomUUID(),
                    createdAt: nowIso,
                    ...c,
                  },
                })
              );
            }),
            mergeMap((actions) => actions)
          );
      })
    )
  );
}
