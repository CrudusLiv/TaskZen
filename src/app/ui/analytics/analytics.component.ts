import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectStreak, selectStats } from './state/analytics.selectors';
import { AnalyticsActions } from './state/analytics.actions';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  private store = inject(Store);
  streak$ = this.store.select(selectStreak);
  stats$ = this.store.select(selectStats);
  ngOnInit(){
    const today = new Date();
    const stats = Array.from({ length: 7}).map((_,i)=>{ const d = new Date(today); d.setDate(d.getDate()-i); return { date: d.toISOString().substring(0,10), completed: Math.floor(Math.random()*5), minutes: Math.floor(Math.random()*180)}; }).reverse();
    this.store.dispatch(AnalyticsActions.loadSuccess({ streak: 3, stats }));
  }
}