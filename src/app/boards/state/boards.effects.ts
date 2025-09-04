import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BoardsActions } from './boards.actions';
import { switchMap, of, from, filter, tap } from 'rxjs';
import { FirebaseService } from '../../firebase.service';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Store } from '@ngrx/store';
import { selectUser } from '../../auth/state/auth.selectors';
import { BoardMeta } from './boards.models';
import { AuthActions } from '../../auth/state/auth.actions';

@Injectable()
export class BoardsEffects {
  private actions$ = inject(Actions);
  private firebase = inject(FirebaseService);
  private store = inject(Store);
  private user$ = this.store.select(selectUser);
  private boardsUnsub: (()=>void) | null = null;

  private ensureInit(){ this.firebase.init(); }

  // Persistent real-time boards listener, (re)established on init or any auth state success events.
  loadBoards$ = createEffect(()=> this.actions$.pipe(
    ofType(
      BoardsActions.init,
      AuthActions.loginSuccess,
      AuthActions.signupSuccess,
      AuthActions.loginWithProviderSuccess,
      AuthActions.logoutSuccess
    ),
    switchMap(()=> this.user$),
    tap(user => {
      // Tear down existing listener whenever this sequence fires.
      if(this.boardsUnsub){ this.boardsUnsub(); this.boardsUnsub = null; }
      if(!user){
        // Dispatch empty state (no seed) when logged out.
        this.store.dispatch(BoardsActions.loadSuccess({ state: { boards:{}, order:[], activeBoardId: undefined, loaded: true } as any }));
        return;
      }
      this.ensureInit();
      const db = getFirestore();
      const qBoards = query(collection(db,'boards'), where('memberIds','array-contains', user.id));
      this.boardsUnsub = onSnapshot(qBoards, snap => {
        const boards: Record<string, BoardMeta> = {};
        const order: string[] = [];
        snap.forEach(docu => {
          const d = docu.data() as any;
          boards[docu.id] = {
            id: docu.id,
            title: d.title,
            description: d.description,
            color: d.color,
            favorite: !!d.favorite,
            createdAt: d.createdAt?.toMillis? new Date(d.createdAt.toMillis()).toISOString(): d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt?.toMillis? new Date(d.updatedAt.toMillis()).toISOString(): d.updatedAt || new Date().toISOString()
          };
          order.push(docu.id);
        });
        // Preserve currently active if still present; else choose first; else undefined.
        const activeExisting = order.includes((this as any).lastActiveId) ? (this as any).lastActiveId : order[0];
        (this as any).lastActiveId = activeExisting;
        this.store.dispatch(BoardsActions.loadSuccess({ state: { boards, order, activeBoardId: activeExisting, loaded: true } as any }));
      });
    })
  ), { dispatch:false });

  createBoard$ = createEffect(()=> this.actions$.pipe(
    ofType(BoardsActions.createBoard),
    switchMap(action => this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        this.ensureInit();
        const db = getFirestore();
        const colRef = collection(db, 'boards');
  const data: any = { title: action.title.trim()||'Untitled', color: action.color, favorite: false, ownerId: user.id, memberIds: [user.id], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  if(action.description && action.description.trim()) data.description = action.description.trim(); // avoid undefined (Firestore rejects undefined)
  else data.description = null; // explicit null is allowed
  return from(addDoc(colRef, data));
      })
    ))
  ), { dispatch: false });

  updateMeta$ = createEffect(()=> this.actions$.pipe(
    ofType(BoardsActions.updateBoardMeta, BoardsActions.renameBoard, BoardsActions.toggleFavorite),
    switchMap(act => this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        return from((async()=> {
          this.ensureInit();
          const db = getFirestore();
            const ref = doc(db, 'boards', (act as any).boardId);
          const changes: any = { updatedAt: serverTimestamp() };
          if(act.type === BoardsActions.renameBoard.type) changes.title = (act as any).title;
          if(act.type === BoardsActions.updateBoardMeta.type && (act as any).changes) Object.assign(changes, (act as any).changes);
          if(act.type === BoardsActions.toggleFavorite.type){
            const snap = await getDoc(ref).catch(()=>undefined);
            const fav = snap?.data()? (snap.data() as any).favorite : false;
            changes.favorite = !fav;
          }
          await updateDoc(ref, changes);
        })());
      })
    ))
  ), { dispatch:false });

  deleteBoard$ = createEffect(()=> this.actions$.pipe(
    ofType(BoardsActions.deleteBoard),
    switchMap(({ boardId })=> this.user$.pipe(
      switchMap(user => {
        if(!user) return of();
        this.ensureInit();
        const db = getFirestore();
        return from(deleteDoc(doc(db, 'boards', boardId)));
      })
    ))
  ), { dispatch:false });
}
