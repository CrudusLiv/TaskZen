import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  selectItemsCapturedToday,
  selectItemsCompletedToday,
  selectFocusActiveMinutesToday,
  selectEnergyTrend,
  selectRoutineAdherence,
  selectPriorityDistribution,
} from './insights.selectors';
@Component({
  standalone: true,
  selector: 'app-insights-page',
  imports: [CommonModule],
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
})
export class InsightsPage {
  capturedToday$!: Observable<number>;
  completedToday$!: Observable<number>;
  focusMinutesToday$!: Observable<number>;
  energyTrend$!: Observable<any>;
  routineAdherence$!: Observable<any>;
  priorityDistribution$!: Observable<any>;

  constructor(private store: Store) {
    this.capturedToday$ = this.store.select(selectItemsCapturedToday);
    this.completedToday$ = this.store.select(selectItemsCompletedToday);
    this.focusMinutesToday$ = this.store.select(selectFocusActiveMinutesToday);
    this.energyTrend$ = this.store.select(selectEnergyTrend);
    this.routineAdherence$ = this.store.select(selectRoutineAdherence);
    this.priorityDistribution$ = this.store.select(selectPriorityDistribution);
  }
}
