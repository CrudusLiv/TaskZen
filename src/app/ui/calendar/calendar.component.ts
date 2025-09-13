import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectEventsByDate } from './state/calendar.selectors';
import { CalendarActions } from './state/calendar.actions';
import { BoardActions } from '../kanban/state/board.actions';
import { selectBoardState, selectUnscheduledCards } from '../kanban/state/board.selectors';
import { selectDailyFocusIds } from '../planner/state/planner.selectors';
// ...existing imports...
import { DialogService } from '../dialogs/services/dialog.service';
import { InputDialogComponent } from '../dialogs/input-dialog/input-dialog.component';

interface CalendarDay {
  iso: string | null; // null for placeholder
  day: number | null;
  inMonth: boolean;
  isToday: boolean;
}
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

  // Month / selection state
  private today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth()); // 0-based
  days = signal<CalendarDay[]>([]);
  selectedDate = signal<string>(this.toISO(this.today));
  weekLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  drawerOpen = signal<boolean>(true);

  eventsMap$ = this.eventsByDate$; // alias for template readability
  selectedEvents = computed(()=> {
    // NOTE: we resolve via async pipe in template; computed kept for potential signal based mapping later
    return [] as any[];
  });

  // unscheduledCards now from selector

  constructor() { this.buildMonth(); }

  private buildMonth() {
    const y = this.currentYear();
    const m = this.currentMonth();
    const firstOfMonth = new Date(y, m, 1);
    const startWeekday = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayISO = this.toISO(this.today);
    const arr: CalendarDay[] = [];
    // leading blanks
    for(let i=0;i<startWeekday;i++){ arr.push({ iso: null, day: null, inMonth:false, isToday:false }); }
    for(let d=1; d<=daysInMonth; d++){
      const iso = this.toISO(new Date(y,m,d));
      arr.push({ iso, day:d, inMonth:true, isToday: iso===todayISO });
    }
    // trailing blanks to fill grid (multiple of 7)
    while(arr.length % 7 !== 0){ arr.push({ iso:null, day:null, inMonth:false, isToday:false }); }
    this.days.set(arr);
    // Adjust selected date if month changed and selection outside
    const sel = this.selectedDate();
    if(sel.substring(0,7) !== `${y}-${(m+1).toString().padStart(2,'0')}`){
      this.selectedDate.set(this.toISO(new Date(y,m,1)));
    }
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

  goToday(){
    this.currentYear.set(this.today.getFullYear());
    this.currentMonth.set(this.today.getMonth());
    this.buildMonth();
    this.selectedDate.set(this.toISO(this.today));
  }

  selectDay(day: CalendarDay){
    if(!day.inMonth || !day.iso) return;
    this.selectedDate.set(day.iso);
    // auto open drawer when changing selection
    if(!this.drawerOpen()) this.drawerOpen.set(true);
  }

  toISO(d: Date){ return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().substring(0,10); }

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

  toggleDrawer(){ this.drawerOpen.set(!this.drawerOpen()); }
  closeDrawer(){ this.drawerOpen.set(false); }
}
