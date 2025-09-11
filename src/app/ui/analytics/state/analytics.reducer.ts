import { createReducer, on } from '@ngrx/store';
import { AnalyticsActions, ProductivityStats } from './analytics.actions';

export const analyticsFeatureKey = 'analytics';

export interface AnalyticsState {
  streak: number;
  stats: ProductivityStats[];
  loaded: boolean;
}

const initialState: AnalyticsState = { streak: 0, stats: [], loaded: false };

export const analyticsReducer = createReducer(
  initialState,
  on(AnalyticsActions.loadSuccess, (s, { streak, stats }) => ({ ...s, streak, stats, loaded: true }))
);
