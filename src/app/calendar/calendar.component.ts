import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectEventsByDate } from './state/calendar.selectors';
import { CalendarActions } from './state/calendar.actions';

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
  monthDays: string[] = [];
  constructor(){
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const iso = new Date(Date.UTC(year, month, d)).toISOString().substring(0,10);
      this.monthDays.push(iso);
    }
  }
  hasAny(map: Record<string, any[]>){ return Object.keys(map).length>0; }
  ngOnInit(){ this.store.dispatch(CalendarActions.loadFromCards()); }
}
