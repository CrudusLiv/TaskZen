import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BoardActions } from './board.actions';
import { Store } from '@ngrx/store';
import { selectActiveBoardId } from '../../boards/state/boards.selectors';
import { selectBoardState } from './board.selectors';
import { selectUser } from '../../auth/state/auth.selectors';
import { FirebaseService } from '../../../firebase.service';
import {
  switchMap,
  of,
  from,
  map,
  withLatestFrom,
  filter,
  tap,
  catchError,
  take,
  debounceTime,
  groupBy,
  mergeMap,
  distinctUntilChanged,
} from 'rxjs';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  writeBatch,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { ToastService } from '../../dialogs/services/toast.service';
import { AppActions } from '../../../store/app.actions';
import { DIAG_FIRESTORE_VERBOSE } from '../../../environment.flags';

@Injectable()
export class BoardFirestoreEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private firebase = inject(FirebaseService);
  private user$ = this.store.select(selectUser);
  private activeBoardId$ = this.store.select(selectActiveBoardId);
  private toasts = inject(ToastService);
  private listeningBoardId: string | null = null;
  private unsubCols: (() => void) | null = null;
  private unsubCards: (() => void) | null = null;
  private cardsFallbackTried = false;

  private ensureInit() {
    this.firebase.init();
  }

  // Load board columns & cards when board feature init fires and active board id available
  load$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.init, BoardActions.setActiveBoardFromMeta),
        switchMap(() => this.activeBoardId$.pipe(distinctUntilChanged())),
        filter((id): id is string => !!id),
        withLatestFrom(this.user$),
        filter(([_, user]) => !!user),
  tap(([boardId, user]) => {
          if (this.listeningBoardId === boardId) return; // already listening
          this.ensureInit();
          // teardown previous listeners
          this.unsubCols?.();
          this.unsubCards?.();
          this.listeningBoardId = boardId;
          const db = getFirestore();
          // Add user scoping (assumes security rules require userId match)
          // user provided by withLatestFrom above; apply userId filter when rules require it
          const colsQ = query(
            collection(db, 'boardColumns'),
            where('boardId', '==', boardId)
            // Optionally chain where('userId','==', user.uid || user.id) once user object is available
          );
          const orderedCardsQ = query(
            collection(db, 'cards'),
            where('boardId', '==', boardId),
            // where('userId','==', (user as any)?.id || (user as any)?.uid),
            orderBy('columnId'),
            orderBy('position', 'asc')
          );
          const simpleCardsQ = query(
            collection(db, 'cards'),
            where('boardId', '==', boardId)
            // , where('userId','==', (user as any)?.id || (user as any)?.uid)
          ); // fallback unsorted (sort client side)
          this.unsubCols = onSnapshot(colsQ, (snap) => {
            snap.docChanges().forEach((ch) => {
              const d: any = ch.doc.data();
              if (ch.type === 'removed')
                this.store.dispatch(BoardActions.removeColumn({ columnId: ch.doc.id }));
              else
                this.store.dispatch(
                  BoardActions.upsertColumn({
                    column: {
                      id: ch.doc.id,
                      title: d.title,
                      cardIds: d.cardIds || [],
                      sort: d.sort || 'created',
                    },
                  })
                );
            });
          });
          const startCardsListener = (q: any, isFallback = false) => {
            let pendingUpserts: any[] = [];
            let pendingRemovals: { cardId: string; columnId: string }[] = [];
            let scheduled = false;
            const flush = () => {
              if (pendingUpserts.length)
                this.store.dispatch(BoardActions.upsertCardsBatch({ cards: pendingUpserts }));
              if (pendingRemovals.length)
                this.store.dispatch(BoardActions.removeCardsBatch({ removals: pendingRemovals }));
              pendingUpserts = [];
              pendingRemovals = [];
              scheduled = false;
            };
            return onSnapshot(
              q,
              (snap: any) => {
                snap.docChanges().forEach((ch: any) => {
                  const c: any = ch.doc.data();
                  if (ch.type === 'removed')
                    pendingRemovals.push({ cardId: ch.doc.id, columnId: c.columnId });
                  else
                    pendingUpserts.push({
                      id: ch.doc.id,
                      title: c.title,
                      columnId: c.columnId,
                      description: c.description,
                      dueDate: c.dueDate,
                      priority: c.priority || 'medium',
                      position: c.position,
                      subtasks: c.subtasks || [],
                      tags: c.tags,
                      completed: c.completed,
                      comments: c.comments || [],
                      createdAt: c.createdAt?.toMillis
                        ? new Date(c.createdAt.toMillis()).toISOString()
                        : c.createdAt || new Date().toISOString(),
                      updatedAt: c.updatedAt?.toMillis
                        ? new Date(c.updatedAt.toMillis()).toISOString()
                        : c.updatedAt || new Date().toISOString(),
                    });
                });
                if (!scheduled) {
                  scheduled = true;
                  Promise.resolve().then(flush);
                }
              },
              (err: any) => {
                const code = (err as any)?.code;
                console.error('[BoardFirestore] Card stream error', code, err);
                if (code === 'failed-precondition' && !isFallback && !this.cardsFallbackTried) {
                  this.cardsFallbackTried = true;
                  // Provide user guidance for composite index
                  this.toasts.info("Missing Firestore index for cards ordering. Using fallback (unsorted). Build composite index: cards (boardId asc, columnId asc, position asc). After it builds (~1m), reload.");
                  this.store.dispatch(
                    AppActions.info({
                      message: 'Building Firestore index or falling back (cards).',
                    })
                  );
                  // Switch to simple query
                  this.unsubCards?.();
                  this.unsubCards = startCardsListener(simpleCardsQ, true);
                  return;
                }
                this.store.dispatch(
                  AppActions.error({ message: 'Card stream error', source: 'boardFirestore', code })
                );
              }
            );
          };
          this.cardsFallbackTried = false;
          this.unsubCards = startCardsListener(orderedCardsQ);
          if(DIAG_FIRESTORE_VERBOSE){
            console.log('[BoardFirestore] Attached listeners for board', boardId, { ordered:true });
          }
          // mark feature loaded without wiping existing state
          this.store.dispatch(BoardActions.loadSuccess({ state: undefined }));
        })
      ),
    { dispatch: false }
  );

  addColumn$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.addColumn),
        withLatestFrom(this.activeBoardId$, this.user$),
        switchMap(([{ title }, boardId, user]) => {
          if (!boardId) {
            console.warn('[BoardFirestore] addColumn skipped: no active board id');
            return of();
          }
          if (!user) {
            console.warn('[BoardFirestore] addColumn skipped: user not authenticated');
            this.store.dispatch(
              AppActions.error({ message: 'Login required before modifying board.' })
            );
            return of();
          }
          this.ensureInit();
          if (!this.firebase.db) {
            console.error('[BoardFirestore] Firebase not initialized (no db)');
            this.store.dispatch(AppActions.error({ message: 'Firebase not initialized.' }));
            return of();
          }
          console.debug('[BoardFirestore] Adding column -> board:', boardId, 'title:', title);
          const db = getFirestore();
          const ref = collection(db, 'boardColumns');
          return from(
            addDoc(ref, {
              boardId,
              title: title.trim() || 'Column',
              cardIds: [],
              sort: 'created',
              userId: (user as any)?.id || (user as any)?.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          ).pipe(
            catchError((err: any) => {
              console.error('[BoardFirestore] addColumn error', err);
              this.store.dispatch(
                AppActions.error({
                  message: 'Failed to add column',
                  source: 'boardFirestore',
                  code: err?.code,
                })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  addCard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.addCard),
        withLatestFrom(this.activeBoardId$, this.user$),
        switchMap(([{ columnId, title, priority }, boardId, user]) => {
          if (!boardId) {
            console.warn('[BoardFirestore] addCard skipped: no active board id');
            return of();
          }
          if (!user) {
            console.warn('[BoardFirestore] addCard skipped: user not authenticated');
            this.store.dispatch(
              AppActions.error({ message: 'Login required before modifying board.' })
            );
            return of();
          }
          this.ensureInit();
          if (!this.firebase.db) {
            console.error('[BoardFirestore] Firebase not initialized (no db)');
            return of();
          }
          const db = getFirestore();
          const ref = collection(db, 'cards');
          const position = Date.now();
          console.debug(
            '[BoardFirestore] Adding card -> board:',
            boardId,
            'column:',
            columnId,
            'title:',
            title
          );
          return from(
            addDoc(ref, {
              boardId,
              columnId,
              title: title.trim() || 'Card',
              priority: priority || 'medium',
              position,
              userId: (user as any)?.id || (user as any)?.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              subtasks: [],
            })
          ).pipe(
            catchError((err: any) => {
              console.error('[BoardFirestore] addCard error', err);
              this.store.dispatch(
                AppActions.error({
                  message: 'Failed to add card',
                  source: 'boardFirestore',
                  code: err?.code,
                })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  updateCard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.updateCard),
        switchMap(({ cardId, changes }) => {
          this.ensureInit();
          const db = getFirestore();
          return from(
            updateDoc(doc(db, 'cards', cardId), { ...changes, updatedAt: serverTimestamp() })
          ).pipe(
            catchError((err: any) => {
              this.store.dispatch(
                AppActions.error({ message: 'Update failed', source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  moveCard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.moveCard),
        withLatestFrom(this.store.select(selectBoardState), this.activeBoardId$),
        filter(([, , boardId]) => !!boardId),
        switchMap(([{ cardId, fromColumnId, toColumnId, toIndex }, state]) => {
          this.ensureInit();
          const db = getFirestore();
          // Build target order from client state
          const target = state.columns[toColumnId];
          if (!target) return of();
          const targetIds = target.cardIds.filter((id: string) => id !== cardId);
          const insertIndex = Math.max(0, Math.min(toIndex, targetIds.length));
          targetIds.splice(insertIndex, 0, cardId);
          const prevId = targetIds[insertIndex - 1];
          const nextId = targetIds[insertIndex + 1];
          const prevPos = prevId ? (state.cards[prevId]?.position ?? null) : null;
          const nextPos = nextId ? (state.cards[nextId]?.position ?? null) : null;
          let newPos: number;
          if (prevPos == null && nextPos == null) newPos = Date.now();
          else if (prevPos == null && nextPos != null) newPos = nextPos - 1;
          else if (prevPos != null && nextPos == null) newPos = prevPos + 1;
          else newPos = ((prevPos as number) + (nextPos as number)) / 2;

          // If too tight, normalize whole column to spaced positions
          if (nextPos != null && Math.abs(newPos - (nextPos as number)) < 1e-6) {
            const batch = writeBatch(db);
            targetIds.forEach((id: string, i: number) =>
              batch.update(doc(db, 'cards', id), { position: (i + 1) * 1000 })
            );
            batch.update(doc(db, 'cards', cardId), {
              columnId: toColumnId,
              updatedAt: serverTimestamp(),
            });
            return from(batch.commit()).pipe(
              catchError((err: any) => {
                this.store.dispatch(
                  AppActions.error({ message: `Move failed (${err?.code||'error'})`, source: 'boardFirestore' })
                );
                return of();
              })
            );
          }
          return from(
            updateDoc(doc(db, 'cards', cardId), {
              columnId: toColumnId,
              position: newPos,
              updatedAt: serverTimestamp(),
            })
          ).pipe(
            catchError((err: any) => {
              this.store.dispatch(
                AppActions.error({ message: `Move failed (${err?.code||'error'})`, source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  reorderInColumn$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.reorderInColumn),
        withLatestFrom(this.store.select(selectBoardState), this.activeBoardId$),
        filter(([, , boardId]) => !!boardId),
        switchMap(([{ columnId, previousIndex, currentIndex }, state]) => {
          this.ensureInit();
          if (previousIndex === currentIndex) return of();
          const db = getFirestore();
          const col = state.columns[columnId];
          if (!col) return of();
          const ids = [...col.cardIds];
          const [moved] = ids.splice(previousIndex, 1);
          ids.splice(currentIndex, 0, moved);
          const prevId = ids[currentIndex - 1];
          const nextId = ids[currentIndex + 1];
          const prevPos = prevId ? (state.cards[prevId]?.position ?? null) : null;
          const nextPos = nextId ? (state.cards[nextId]?.position ?? null) : null;
          let newPos: number;
          if (prevPos == null && nextPos == null) newPos = Date.now();
          else if (prevPos == null && nextPos != null) newPos = nextPos - 1;
          else if (prevPos != null && nextPos == null) newPos = prevPos + 1;
          else newPos = ((prevPos as number) + (nextPos as number)) / 2;
          if (nextPos != null && Math.abs(newPos - (nextPos as number)) < 1e-6) {
            const batch = writeBatch(db);
            ids.forEach((id: string, i: number) =>
              batch.update(doc(db, 'cards', id), { position: (i + 1) * 1000 })
            );
            return from(batch.commit()).pipe(
              catchError((err: any) => {
                this.store.dispatch(
                  AppActions.error({ message: `Move failed (${err?.code||'error'})`, source: 'boardFirestore' })
                );
                return of();
              })
            );
          }
          return from(
            updateDoc(doc(db, 'cards', moved), {
              position: newPos,
              updatedAt: serverTimestamp(),
            })
          ).pipe(
            catchError((err: any) => {
              this.store.dispatch(
                AppActions.error({ message: `Move failed (${err?.code||'error'})`, source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  deleteCard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.deleteCard),
        switchMap(({ cardId }) => {
          this.ensureInit();
          const db = getFirestore();
          return from(deleteDoc(doc(db, 'cards', cardId))).pipe(
            catchError((err: any) => {
              this.store.dispatch(
                AppActions.error({ message: 'Delete failed', source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  deleteColumn$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.deleteColumn),
        withLatestFrom(this.store.select(selectActiveBoardId), this.user$),
        switchMap(([{ columnId }, boardId, user]) => {
          if (!boardId || !user) return of();
          this.ensureInit();
          const db = getFirestore();
          return from(
            (async () => {
              // delete all cards in the column, then the column doc
              const cardsQ = query(
                collection(db, 'cards'),
                where('boardId', '==', boardId),
                where('columnId', '==', columnId)
              );
              const snap = await getDocs(cardsQ).catch(() => undefined);
              const batch = writeBatch(db);
              if (snap) {
                snap.forEach((d) => batch.delete(d.ref));
              }
              batch.delete(doc(db, 'boardColumns', columnId));
              await batch.commit();
            })()
          ).pipe(
            catchError((err) => {
              this.store.dispatch(
                AppActions.error({ message: 'Delete column failed', source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  // Debounced grouped persistence for subtasks changes per card
  persistSubtasks$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardActions.addSubtask, BoardActions.toggleSubtask, BoardActions.deleteSubtask),
        map((a) => (a as any).cardId as string),
        groupBy((id) => id),
        mergeMap((group$) =>
          group$.pipe(
            debounceTime(400),
            map((cardId) => cardId)
          )
        ),
        switchMap((cardId) =>
          this.store.select(selectBoardState).pipe(
            take(1),
            map((state) => state.cards[cardId])
          )
        ),
        filter((card) => !!card),
        switchMap((card) => {
          this.ensureInit();
          const db = getFirestore();
          return from(
            updateDoc(doc(db, 'cards', card.id), {
              subtasks: card.subtasks,
              updatedAt: serverTimestamp(),
            })
          ).pipe(
            catchError((err) => {
              this.store.dispatch(
                AppActions.error({ message: 'Subtasks update failed', source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );

  // Debounced grouped persistence for comments/reactions per card
  persistComments$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          BoardActions.addComment,
          BoardActions.editComment,
          BoardActions.deleteComment,
          BoardActions.toggleReaction
        ),
        map((a) => (a as any).cardId as string),
        groupBy((id) => id),
        mergeMap((group$) =>
          group$.pipe(
            debounceTime(500),
            map((cardId) => cardId)
          )
        ),
        switchMap((cardId) =>
          this.store.select(selectBoardState).pipe(
            take(1),
            map((state) => state.cards[cardId])
          )
        ),
        filter((card) => !!card),
        switchMap((card) => {
          this.ensureInit();
          const db = getFirestore();
          return from(
            updateDoc(doc(db, 'cards', card.id), {
              comments: card.comments || [],
              updatedAt: serverTimestamp(),
            })
          ).pipe(
            catchError((err) => {
              this.store.dispatch(
                AppActions.error({ message: 'Comments update failed', source: 'boardFirestore' })
              );
              return of();
            })
          );
        })
      ),
    { dispatch: false }
  );
}
