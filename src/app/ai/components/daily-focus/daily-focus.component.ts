import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectDailyFocusCards } from '../../state/planner.selectors.ext';
import { PlannerActions } from '../../state/planner.actions';

@Component({
  selector: 'app-daily-focus',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-focus.component.html',
  styleUrls: ['./daily-focus.component.scss']
})
export class DailyFocusComponent {
  private store = inject(Store);
  cards$ = this.store.select(selectDailyFocusCards);
  remove(id: string){ this.store.dispatch(PlannerActions.removeDailyFocus({ cardId: id })); }
  clear(){ this.store.dispatch(PlannerActions.clearDailyFocus()); }
}
