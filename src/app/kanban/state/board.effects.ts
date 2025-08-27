import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BoardActions } from './board.actions';
import { Store } from '@ngrx/store';
import { selectBoardState } from './board.selectors';
import { withLatestFrom, tap, map, delay, of, filter, switchMap, takeUntil } from 'rxjs';

const STORAGE_KEY = 'taskzen_kanban';

@Injectable()
export class BoardEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.init),
      map(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            return BoardActions.loadSuccess({ state: JSON.parse(raw) });
          }
        } catch {}
        return BoardActions.loadSuccess({ state: undefined });
      })
    )
  );

  persist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BoardActions.addColumn, BoardActions.renameColumn, BoardActions.deleteColumn,
        BoardActions.addCard, BoardActions.updateCard, BoardActions.deleteCard,
        BoardActions.moveCard, BoardActions.reorderInColumn,
        BoardActions.setFilterText, BoardActions.setFilterPriority, BoardActions.setFilterDue,
        BoardActions.setColumnSort,
        BoardActions.addSubtask, BoardActions.toggleSubtask, BoardActions.deleteSubtask
      ),
      withLatestFrom(this.store.select(selectBoardState)),
      tap(([_, state]) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
      })
    ), { dispatch: false }
  );

  clearUndo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.deleteCard),
      switchMap(() => of(null).pipe(
        delay(5000),
        withLatestFrom(this.store.select(selectBoardState)),
        filter(([_, state]) => !!state.lastDeleted),
        map(() => BoardActions.clearLastDeleted()),
        takeUntil(this.actions$.pipe(ofType(BoardActions.undoDeleteCard)))
      ))
    )
  );
}
