import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { CoachActions } from './coach.actions';
import { map, mergeMap, withLatestFrom, filter } from 'rxjs/operators';
import { timer } from 'rxjs';
import { selectEnergyLogs } from '../../energy/state/energy.selectors';
import { selectItemsArray, selectItemsWithPriority } from '../../items/state/items.selectors';
import { selectRoutineAdherence } from '../../insights/insights.selectors';
import { selectCurrentFocus } from '../../focus/state/focus.selectors';

// Simple rule evaluation placeholders
// Rules:
//  - Low energy recent log => suggest recharge
//  - No focus session running & high priority items exist => micro-start prompt
//  - Routine adherence < 50% => routine encouragement
//  - Many inbox items (>10) => brain dump organize suggestion

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

        // Low energy
        const latest = energy[0];
        if (latest && latest.level <= 2) {
          cards.push({
            category: 'Energy',
            title: 'Energy is low',
            body: 'Consider a short recharge (2–5m movement or hydration).',
            suggestion: 'Log a reset after break',
            ruleId: 'low-energy',
          });
        }

        // No active focus but have a high priority item
        if (!focus && prioritized.length) {
          const top = prioritized[0];
          cards.push({
            category: 'Focus',
            title: 'Micro-start opportunity',
            body: `Take 90s to advance: ${top.title}`,
            suggestion: 'Start a micro focus session',
            ruleId: 'micro-start',
          });
        }

        // Routine adherence low
        if (adherence.percent < 50) {
          cards.push({
            category: 'Routines',
            title: 'Routines need love',
            body: 'Low active routine structure reduces decision ease.',
            suggestion: 'Open routines & add one micro step',
            ruleId: 'routine-low',
          });
        }

        // Inbox clutter
        const inboxCount = items.filter((i) => i.status === 'inbox').length;
        if (inboxCount > 10) {
          cards.push({
            category: 'Mindset',
            title: 'Inbox is heavy',
            body: 'Large inbox can create friction. Batch triage helps clarity.',
            suggestion: 'Schedule a 5m triage block',
            ruleId: 'inbox-heavy',
          });
        }

        // De-duplicate by ruleId existing last hour
        return this.store
          .select((state) => state as any)
          .pipe(
            // quick access to coach state not strongly typed here
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
                    id: 'c' + Date.now() + Math.random().toString(16).slice(2),
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
