import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { DailyFocusComponent } from '../daily-focus/daily-focus.component';
import { selectCandidateFocusCards, selectDailyFocusIds } from '../../state/planner.selectors';
import { PlannerActions } from '../../state/planner.actions';

@Component({
  selector: 'app-planner-page',
  standalone: true,
  imports: [CommonModule, DailyFocusComponent],
  templateUrl: './planner-page.component.html',
  styleUrls: ['./planner-page.component.scss']
})
export class PlannerPageComponent {
  private store = inject(Store);
  candidates$ = this.store.select(selectCandidateFocusCards);
  focusIds$ = this.store.select(selectDailyFocusIds);
  showCompleted = signal(false);
  add(cardId: string){ this.store.dispatch(PlannerActions.addDailyFocus({ cardId })); }
  remove(cardId: string){ this.store.dispatch(PlannerActions.removeDailyFocus({ cardId })); }
  clear(){ this.store.dispatch(PlannerActions.clearDailyFocus()); }
}
