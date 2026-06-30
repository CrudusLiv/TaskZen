import { Component, inject } from '@angular/core';
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
  selectEnergyDipWindow,
  selectCompletionStreak,
} from './insights.selectors';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader/skeleton-loader.component';

@Component({
  standalone: true,
  selector: 'app-insights-page',
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './insights.page.html',
  styleUrls: ['./insights.page.scss'],
})
export class InsightsPage {
  private store = inject(Store);

  capturedToday$: Observable<number>;
  completedToday$: Observable<number>;
  focusMinutesToday$: Observable<number>;
  energyTrend$: Observable<{ level: number; createdAt: string }[]>;
  routineAdherence$: Observable<{ ratio: number; percent: number }>;
  priorityDistribution$: Observable<{ high: number; medium: number; low: number }>;
  energyDipWindow$: Observable<string | null>;
  completionStreak$: Observable<number>;

  constructor() {
    this.capturedToday$ = this.store.select(selectItemsCapturedToday);
    this.completedToday$ = this.store.select(selectItemsCompletedToday);
    this.focusMinutesToday$ = this.store.select(selectFocusActiveMinutesToday);
    this.energyTrend$ = this.store.select(selectEnergyTrend);
    this.routineAdherence$ = this.store.select(selectRoutineAdherence);
    this.priorityDistribution$ = this.store.select(selectPriorityDistribution);
    this.energyDipWindow$ = this.store.select(selectEnergyDipWindow);
    this.completionStreak$ = this.store.select(selectCompletionStreak);
  }
}
