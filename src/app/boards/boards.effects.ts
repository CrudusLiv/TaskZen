import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BoardsActions } from './boards.actions';
import { Store } from '@ngrx/store';
import { selectBoardsState } from './boards.selectors';
import { map, withLatestFrom, tap, switchMap, of, delay, filter, takeUntil } from 'rxjs';

const STORAGE_KEY = 'taskzen_boards_meta';

@Injectable()
export class BoardsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  load$ = createEffect(() => this.actions$.pipe(
    ofType(BoardsActions.init),
    map(() => {
      try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) return BoardsActions.loadSuccess({ state: JSON.parse(raw) }); } catch {}
      return BoardsActions.loadSuccess({ state: undefined });
    })
  ));

  persist$ = createEffect(() => this.actions$.pipe(
    ofType(
      BoardsActions.createBoard, BoardsActions.renameBoard, BoardsActions.updateBoardMeta,
      BoardsActions.deleteBoard, BoardsActions.undoDeleteBoard, BoardsActions.toggleFavorite,
      BoardsActions.setActiveBoard
    ),
    withLatestFrom(this.store.select(selectBoardsState)),
    tap(([_, state]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} })
  ), { dispatch: false });

  autoClearDeleted$ = createEffect(() => this.actions$.pipe(
    ofType(BoardsActions.deleteBoard),
    switchMap(() => of(null).pipe(
      delay(5000),
      withLatestFrom(this.store.select(selectBoardsState)),
      filter(([_, s]) => !!s.lastDeleted),
      map(() => BoardsActions.clearLastDeleted()),
      takeUntil(this.actions$.pipe(ofType(BoardsActions.undoDeleteBoard)))
    ))
  ));
}
