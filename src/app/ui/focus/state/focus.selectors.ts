import { createFeatureSelector, createSelector } from '@ngrx/store';
import { focusFeatureKey, FocusSessionState } from './focus.reducer';

export const selectFocusFeature = createFeatureSelector<FocusSessionState>(focusFeatureKey);

export const selectCurrentFocus = createSelector(selectFocusFeature, (f) => f.current);
