import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BoardActions } from './board.actions';
import { Store } from '@ngrx/store';
import { selectBoardState } from './board.selectors';
import { withLatestFrom, tap, map, delay, of, filter, switchMap, takeUntil } from 'rxjs';
import { selectActiveBoardMeta } from '../../boards/state/boards.selectors';

const STORAGE_KEY = 'taskzen_kanban';

@Injectable()
export class BoardEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  // LocalStorage bootstrap removed (Firestore now authoritative).
  load$ = createEffect(() => this.actions$.pipe(
    ofType(BoardActions.init),
    map(()=> BoardActions.loadSuccess({ state: undefined }))
  ));

  // Map active board meta (from boards slice) into board state baseline
  activeBoardChange$ = createEffect(()=> this.store.select(selectActiveBoardMeta).pipe(
    filter(meta => !!meta),
    map(meta => BoardActions.setActiveBoardFromMeta({ boardId: (meta as any).id, title: (meta as any).title }))
  ));

  // Persistence to LocalStorage removed.

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
