import { createFeatureSelector, createSelector } from '@ngrx/store';
import { preferencesFeatureKey, PreferencesState } from './preferences.actions';

export const selectPreferencesState =
  createFeatureSelector<PreferencesState>(preferencesFeatureKey);

export const selectCalmMode = createSelector(selectPreferencesState, (state) => state.calmMode);
