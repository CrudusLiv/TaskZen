import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectCoachCards } from './state/coach.selectors';
import { CoachActions, CoachCard } from './state/coach.actions';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader/skeleton-loader.component';

@Component({
  standalone: true,
  selector: 'app-coach-page',
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './coach.page.html',
  styleUrls: ['./coach.page.scss'],
})
export class CoachPage {
  private store = inject(Store);
  cards$: Observable<CoachCard[]>;

  constructor() {
    this.cards$ = this.store.select(selectCoachCards);
  }

  refresh() {
    this.store.dispatch(CoachActions.evaluateRules());
  }

  dismiss(id: string) {
    this.store.dispatch(CoachActions.dismissCard({ id }));
  }

  pin(id: string) {
    this.store.dispatch(CoachActions.pinCard({ id }));
  }
}
