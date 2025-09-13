import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { PlannerActions } from './planner.actions';
import { Store } from '@ngrx/store';
import { withLatestFrom, map, filter, switchMap, tap } from 'rxjs';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { selectPlannerState } from './planner.selectors';
import { selectUser } from '../../auth/state/auth.selectors';

@Injectable()
export class PlannerEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private user$ = this.store.select(selectUser);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlannerActions.loadDailyFocus),
      withLatestFrom(this.user$),
      switchMap(async ([, user]) => {
        if (!user) return PlannerActions.loadDailyFocusSuccess({ ids: [] });
        const db = getFirestore();
        const userId = (user as any).id || (user as any).uid;
        if (!userId) {
          return PlannerActions.loadDailyFocusSuccess({ ids: [] });
        }
        const ref = doc(db, 'plannerFocus', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return PlannerActions.loadDailyFocusSuccess({ ids: [] });
        const data = snap.data();
        return PlannerActions.loadDailyFocusSuccess({
          ids: Array.isArray(data['ids']) ? data['ids'] : [],
        });
      })
    )
  );

  persist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          PlannerActions.addDailyFocus,
          PlannerActions.removeDailyFocus,
          PlannerActions.clearDailyFocus,
          PlannerActions.persistDailyFocus
        ),
        withLatestFrom(this.user$, this.store.select(selectPlannerState)),
        filter(([_, user]) => !!user),
        tap(async ([, user, planner]) => {
          const db = getFirestore();
          const userId = (user as any).id || (user as any).uid;
          if (!userId) return; // safety guard
          const ref = doc(db, 'plannerFocus', userId);
          await setDoc(ref, { ids: planner.dailyFocusIds, updatedAt: Date.now() }, { merge: true });
        })
      ),
    { dispatch: false }
  );
}
