import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { BoardActions } from '../../kanban/state/board.actions';
import { selectBoardState } from '../../kanban/state/board.selectors';
import { CalendarActions } from './calendar.actions';
import { map, withLatestFrom, filter } from 'rxjs';
import { selectActiveBoardId } from '../../boards/state/boards.selectors';

@Injectable()
export class CalendarEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  loadFromCards$ = createEffect(() => this.actions$.pipe(
    ofType(CalendarActions.loadFromCards, BoardActions.upsertCardsBatch, BoardActions.removeCardsBatch, BoardActions.setActiveBoardFromMeta),
    withLatestFrom(this.store.select(selectBoardState), this.store.select(selectActiveBoardId)),
    map(([action, state, boardId]) => {
      if(!boardId) return CalendarActions.upsertEvents({ events: [] });
      const cards = Object.values(state.cards || {}) as any[];
      const dated = cards.filter(c => !!c.dueDate);
      return CalendarActions.upsertEvents({ events: dated.map(c => ({ id: c.id, title: c.title, date: c.dueDate!, cardId: c.id, priority: c.priority })) });
    })
  ));
}
