import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectEventsByDate } from './state/calendar.selectors';
import { CalendarActions } from './state/calendar.actions';
import { BoardActions } from '../kanban/state/board.actions';
import { selectBoardState } from '../kanban/state/board.selectors';
import { selectDailyFocusIds } from '../planner/state/planner.selectors';
import { computed, signal } from '@angular/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent {
  private store = inject(Store);
  eventsByDate$ = this.store.select(selectEventsByDate);
  private boardState$ = this.store.select(selectBoardState);
  private focusIds$ = this.store.select(selectDailyFocusIds);

  // Month state
  private today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth()); // 0-based
  monthDays = signal<string[]>([]);

  // Derived unscheduled cards (no dueDate)
  unscheduledCards = computed(() => {
    let cards: any[] = [];
    let focusIds: string[] = [];
    this.boardState$.subscribe(bs => { cards = Object.values(bs.cards || {}); }).unsubscribe();
    this.focusIds$.subscribe(ids => { focusIds = ids; }).unsubscribe();
    const focusSet = new Set(focusIds);
    return cards.filter(c => !c.dueDate && !c.completed).sort((a: any, b: any) => {
      const prio = (p:string)=> p==='high'?0: p==='medium'?1:2;
      const pa = prio(a.priority); const pb = prio(b.priority);
      if(pa!==pb) return pa-pb;
      return a.title.localeCompare(b.title);
    }).slice(0,50).map(c => ({ ...c, inFocus: focusSet.has(c.id) }));
  });

  constructor(){
    this.buildMonth();
  }

  private buildMonth(){
    const y = this.currentYear();
    const m = this.currentMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const arr: string[] = [];
    for(let d=1; d<=daysInMonth; d++){
      const iso = new Date(Date.UTC(y, m, d)).toISOString().substring(0,10);
      arr.push(iso);
    }
    this.monthDays.set(arr);
  }

  prevMonth(){
    let y = this.currentYear();
    let m = this.currentMonth() - 1;
    if(m < 0){ m = 11; y--; }
    this.currentYear.set(y); this.currentMonth.set(m); this.buildMonth();
  }
  nextMonth(){
    let y = this.currentYear();
    let m = this.currentMonth() + 1;
    if(m > 11){ m = 0; y++; }
    this.currentYear.set(y); this.currentMonth.set(m); this.buildMonth();
  }

  hasAny(map: Record<string, any[]>){ return Object.keys(map).length>0; }
  clearDue(cardId: string){ this.store.dispatch(BoardActions.updateCard({ cardId, changes: { dueDate: null as any } })); }
  openCard(cardId: string){ this.store.dispatch(BoardActions.openCard({ cardId })); }
  schedule(cardId: string, date: string){ this.store.dispatch(BoardActions.updateCard({ cardId, changes: { dueDate: date as any } })); }

  isFocus(cardId?: string){
    let ids: string[] = [];
    this.focusIds$.subscribe(v=> ids=v).unsubscribe();
    return !!cardId && ids.includes(cardId);
  }

  ngOnInit(){ this.store.dispatch(CalendarActions.loadFromCards()); }
}
