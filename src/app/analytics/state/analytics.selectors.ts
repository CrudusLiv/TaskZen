import { createFeatureSelector, createSelector } from '@ngrx/store';
import { analyticsFeatureKey, AnalyticsState } from './analytics.reducer';

export const selectAnalyticsState = createFeatureSelector<AnalyticsState>(analyticsFeatureKey);
export const selectStreak = createSelector(selectAnalyticsState, s => s.streak);
export const selectStats = createSelector(selectAnalyticsState, s => s.stats);
