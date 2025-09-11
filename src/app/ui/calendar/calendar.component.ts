import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectEventsByDate } from './state/calendar.selectors';
import { CalendarActions } from './state/calendar.actions';
import { BoardActions } from '../kanban/state/board.actions';
import { selectBoardState, selectUnscheduledCards } from '../kanban/state/board.selectors';
import { selectDailyFocusIds } from '../planner/state/planner.selectors';
import { computed, signal } from '@angular/core';
import { DialogService } from '../dialogs/services/dialog.service';
import { InputDialogComponent } from '../dialogs/input-dialog/input-dialog.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent {
  private store = inject(Store);
  private dialog = inject(DialogService);
  eventsByDate$ = this.store.select(selectEventsByDate);
  private boardState$ = this.store.select(selectBoardState);
  private focusIds$ = this.store.select(selectDailyFocusIds);
  unscheduledCards$ = this.store.select(selectUnscheduledCards);

  // Month state
  private today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth()); // 0-based
  monthDays = signal<string[]>([]);

  // unscheduledCards now from selector

  constructor() {
    this.buildMonth();
  }

  private buildMonth() {
    const y = this.currentYear();
    const m = this.currentMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const arr: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = new Date(Date.UTC(y, m, d)).toISOString().substring(0, 10);
      arr.push(iso);
    }
    this.monthDays.set(arr);
  }

  prevMonth() {
    let y = this.currentYear();
    let m = this.currentMonth() - 1;
    if (m < 0) {
      m = 11;
      y--;
    }
    this.currentYear.set(y);
    this.currentMonth.set(m);
    this.buildMonth();
  }
  nextMonth() {
    let y = this.currentYear();
    let m = this.currentMonth() + 1;
    if (m > 11) {
      m = 0;
      y++;
    }
    this.currentYear.set(y);
    this.currentMonth.set(m);
    this.buildMonth();
  }

  hasAny(map: Record<string, any[]>) {
    return Object.keys(map).length > 0;
  }
  clearDue(cardId: string) {
    this.store.dispatch(BoardActions.updateCard({ cardId, changes: { dueDate: null as any } }));
  }
  openCard(cardId: string) {
    this.store.dispatch(BoardActions.openCard({ cardId }));
  }
  schedule(cardId: string, date: string) {
    this.store.dispatch(BoardActions.updateCard({ cardId, changes: { dueDate: date as any } }));
  }

  isFocus(cardId?: string) {
    let ids: string[] = [];
    this.focusIds$.subscribe((v) => (ids = v)).unsubscribe();
    return !!cardId && ids.includes(cardId);
  }

  ngOnInit() {
    this.store.dispatch(CalendarActions.loadFromCards());
    this.store.dispatch(CalendarActions.loadUserEvents());
  }

  async addStandalone(date: string) {
    const ref = this.dialog.open(InputDialogComponent, { data: { title: 'New Event', label: 'Title', placeholder: 'Event title' } });
    const title = await ref.afterClosed;
    if (title && title.trim()) this.store.dispatch(CalendarActions.addEventRequest({ title: title.trim(), date }));
  }

  deleteEvent(id: string, source: string) {
    if (source === 'event') {
      if (confirm('Delete event?')) this.store.dispatch(CalendarActions.deleteEvent({ id }));
    } else if (source === 'card') {
      this.clearDue(id); // cardId == id for card sourced events
    }
  }
}
