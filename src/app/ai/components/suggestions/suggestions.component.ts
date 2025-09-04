import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectEnrichedTopSuggestions, selectAiState } from '../../state/planner.selectors';
import { selectDailyFocusIds } from '../../state/planner.selectors.ext';
import { PlannerActions } from '../../state/planner.actions';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestions.component.html',
  styleUrls: ['./suggestions.component.scss'],
})
export class SuggestionsComponent {
  private store = inject(Store);
  suggestions$ = this.store.select(selectEnrichedTopSuggestions);
  ai$ = this.store.select(selectAiState);
  focusIds$ = this.store.select(selectDailyFocusIds);
  filter = signal('');
  setFilter(v: string) {
    this.filter.set(v);
  }
  filtered = (list: any[]) =>
    !this.filter()
      ? list
      : list.filter((l) => l.cardId?.toLowerCase().includes(this.filter().toLowerCase()));
  trackId = (_: number, s: any) => s.id;
  regen() {
    this.store.dispatch(PlannerActions.generateSuggestions());
  }
  accept(id: string) {
    this.store.dispatch(PlannerActions.acceptSuggestion({ id }));
  }
  reject(id: string) {
    this.store.dispatch(PlannerActions.rejectSuggestion({ id }));
  }
  set(key: string, value: number) {
    this.store.dispatch(
      PlannerActions.setProfileWeights({ weights: { [key]: parseFloat(String(value)) } } as any)
    );
  }
  apply(id: string) {
    this.store.dispatch(PlannerActions.applySuggestion({ id }));
  }
  dispatchAdd(cardId: string) {
    this.store.dispatch(PlannerActions.addDailyFocus({ cardId }));
  }
  openCard(cardId: string) {
    this.store.dispatch({ type: '[Board] Open Card', cardId });
  }
  scoreBg(score: number) {
    const capped = Math.min(100, Math.max(0, score));
    const hue = 180 - (capped / 100) * 120;
    return `hsl(${hue} 70% 40%)`;
  }
  ngOnInit() {
    this.regen();
  }
}
