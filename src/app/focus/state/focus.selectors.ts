import { createFeatureSelector, createSelector } from '@ngrx/store';
import { focusFeatureKey, FocusState } from './focus.reducer';

export const selectFocusState = createFeatureSelector<FocusState>(focusFeatureKey);
export const selectFocusActive = createSelector(selectFocusState, s => s.active);
export const selectFocusRemaining = createSelector(selectFocusState, s => s.remaining);
export const selectFocusCompleted = createSelector(selectFocusState, s => s.completedPomodoros);
