import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { BoardActions } from '../../kanban/state/board.actions';
import { selectBoardState } from '../../kanban/state/board.selectors';
import { CalendarActions } from './calendar.actions';
import { map, withLatestFrom, filter, switchMap, tap } from 'rxjs';
import { selectUser } from '../../auth/state/auth.selectors';
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { CalendarEvent } from './calendar.models';
import { selectActiveBoardId } from '../../boards/state/boards.selectors';

@Injectable()
export class CalendarEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private user$ = this.store.select(selectUser);
  private unsubscribeUserEvents: (() => void) | null = null;

  loadFromCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CalendarActions.loadFromCards,
        BoardActions.upsertCardsBatch,
        BoardActions.removeCardsBatch,
        BoardActions.setActiveBoardFromMeta
      ),
      withLatestFrom(this.store.select(selectBoardState), this.store.select(selectActiveBoardId)),
      map(([action, state, boardId]) => {
        if (!boardId) return CalendarActions.upsertEvents({ events: [] });
        const cards = Object.values(state.cards || {}) as any[];
        const dated = cards.filter((c) => !!c.dueDate);
        return CalendarActions.upsertEvents({
          events: dated.map((c) => ({
            id: c.id,
            title: c.title,
            date: c.dueDate!,
            source: 'card',
            cardId: c.id,
            priority: c.priority,
          })),
        });
      })
    )
  );

  // Load and subscribe to user standalone events
  loadUserEvents$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(CalendarActions.loadUserEvents),
        withLatestFrom(this.user$),
        filter(([, user]) => !!user),
        tap(([, user]) => {
          if (this.unsubscribeUserEvents) {
            this.unsubscribeUserEvents();
          }
          const db = getFirestore();
          const q = query(
            collection(db, 'calendarEvents'),
            where('ownerId', '==', (user as any).uid)
          );
          this.unsubscribeUserEvents = onSnapshot(q, (snap) => {
            const events: CalendarEvent[] = [];
            snap.forEach((docSnap) => {
              const d = docSnap.data();
              events.push({ id: docSnap.id, title: d['title'], date: d['date'], source: 'event' });
            });
            this.store.dispatch(CalendarActions.loadUserEventsSuccess({ events }));
          });
        })
      ),
    { dispatch: false }
  );

  // Add standalone event
  addEventReq$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.addEventRequest),
      withLatestFrom(this.user$),
      filter(([, user]) => !!user),
      switchMap(async ([{ title, date }, user]) => {
        const db = getFirestore();
        const ref = await addDoc(collection(db, 'calendarEvents'), {
          ownerId: (user as any).uid,
          title,
          date,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return CalendarActions.addEvent({ event: { id: ref.id, title, date, source: 'event' } });
      })
    )
  );

  updateEventReq$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.updateEventRequest),
      withLatestFrom(this.user$),
      filter(([, user]) => !!user),
      switchMap(async ([{ id, changes }, user]) => {
        const db = getFirestore();
        const ref = doc(db, 'calendarEvents', id);
        await updateDoc(ref, { ...changes, updatedAt: Date.now() });
        return CalendarActions.upsertEvents({ events: [{ id, ...changes } as any] });
      })
    )
  );

  deleteEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.deleteEvent),
      filter((a) => a.id.startsWith('evt_') || true),
      switchMap(async (a) => {
        const db = getFirestore();
        await deleteDoc(doc(db, 'calendarEvents', a.id));
        return { type: '[Calendar] _noop' } as any;
      })
    )
  );
}
