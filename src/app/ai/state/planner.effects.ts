import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { selectBoardState } from '../../kanban/state/board.selectors';
import { PlannerService } from '../services/planner.service';
import { map, withLatestFrom, tap, filter, debounceTime, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAiState } from './planner.selectors';
import { PlannerActions } from './planner.actions';
import { BoardActions } from '../../kanban/state/board.actions';
import { updateDoc, doc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { PlannerApiService } from '../services/planner.api.service';
import { selectUser } from '../../auth/state/auth.selectors';

@Injectable()
export class PlannerEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private planner = inject(PlannerService);
  private api = inject(PlannerApiService);
  private user$ = this.store.select(selectUser);

  generate$ = createEffect(() => this.actions$.pipe(
    ofType(PlannerActions.generateSuggestions, BoardActions.upsertCardsBatch),
    debounceTime(150),
    tap(()=> this.store.dispatch(PlannerActions.generationStarted())),
    withLatestFrom(this.store.select(selectBoardState), this.store.select(selectAiState), this.user$),
    switchMap(async ([_, state, ai, user]) => {
      const cards = Object.values(state.cards || {}) as any[];
      // Attempt remote scoring first if endpoint configured
      const remote = await this.api.sendCardsForScoring(cards, ai.profile);
      if(remote && Array.isArray(remote)){
        return PlannerActions.upsertSuggestions({ suggestions: remote.map(r => ({ id: r.cardId, cardId: r.cardId, proposedDate: r.proposedDate, score: r.score, reason: 'remote' })) });
      }
      const scored = cards.map(c => ({ cardId: c.id, id: c.id, proposedDate: this.planner.proposeDate(c), score: this.planner.score(c, ai.profile), reason: 'heuristic-v1' }));
      return PlannerActions.upsertSuggestions({ suggestions: scored });
    })
  ));

  apply$ = createEffect(() => this.actions$.pipe(
    ofType(PlannerActions.applySuggestion),
    withLatestFrom(this.store.select(selectAiState), this.store.select(selectBoardState)),
    map(([{ id }, ai, board]) => {
      const s = ai.suggestions[id]; if(!s) return null;
      return { suggestion: s, card: board.cards[s.cardId] };
    }),
    filter((p): p is any => !!p && !!p.card),
    tap(({ suggestion, card }) => {
      const db = getFirestore();
      updateDoc(doc(db, 'cards', suggestion.cardId), { dueDate: suggestion.proposedDate, updatedAt: serverTimestamp() });
    }),
    map(()=> PlannerActions.generateSuggestions())
  ));

  feedback$ = createEffect(() => this.actions$.pipe(
    ofType(PlannerActions.acceptSuggestion, PlannerActions.rejectSuggestion),
    withLatestFrom(this.user$),
    tap(([action, user]) => {
      const id = (action as any).id; this.api.recordFeedback(id, action.type.endsWith('Accept Suggestion') ? 'accept':'reject');
    }),
    map(([action]) => {
      const delta = (action as any).type.endsWith('Accept Suggestion') ? { weightUrgency: 1.02, weightPriority: 1.01 } : { weightAge: 1.01 };
      return PlannerActions.updateProfileWeights({ delta });
    })
  ));

  // Future: load persisted profile from Firestore (plannerProfiles/{userId}) once user logs in
  loadUserProfile$ = createEffect(() => this.user$.pipe(
    filter(u => !!u),
    switchMap(async (u:any) => {
      const data:any = await this.api.loadProfileFromFirestore(u.uid);
      if(data && data['profile']){ return PlannerActions.setProfileWeights({ weights: data['profile'] }); }
      return { type: '[Planner] noop' } as any;
    })
  ));

  saveUserProfile$ = createEffect(() => this.actions$.pipe(
    ofType(PlannerActions.updateProfileWeights, PlannerActions.setProfileWeights),
    withLatestFrom(this.user$, this.store.select(selectAiState)),
    filter(([_, user]) => !!user),
    tap(([_, user, ai]) => this.api.saveProfileToFirestore((user as any).uid, { profile: ai.profile, daily: ai.dailyFocusIds })),
  ), { dispatch: false });

  persistProfile$ = createEffect(() => this.actions$.pipe(
    ofType(PlannerActions.updateProfileWeights, PlannerActions.setProfileWeights, PlannerActions.addDailyFocus, PlannerActions.removeDailyFocus, PlannerActions.clearDailyFocus),
    withLatestFrom(this.store.select(selectAiState)),
    tap(([_, ai]) => {
      localStorage.setItem('plannerProfile', JSON.stringify({ profile: ai.profile, daily: ai.dailyFocusIds }));
    })
  ), { dispatch: false });

  loadProfile$ = createEffect(() => this.actions$.pipe(
    ofType(PlannerActions.generateSuggestions),
    map(() => {
      const raw = localStorage.getItem('plannerProfile');
      if(!raw) return { type: '[Planner] noop' } as any;
      try { const parsed = JSON.parse(raw); return PlannerActions.setProfileWeights({ weights: parsed.profile || {} }); } catch { return { type: '[Planner] noop' } as any; }
    })
  ));
}
