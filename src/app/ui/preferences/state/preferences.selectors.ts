import { createFeatureSelector, createSelector } from '@ngrx/store';
import { preferencesFeatureKey, PreferencesState } from './preferences.actions';

export const selectPreferencesState =
  createFeatureSelector<PreferencesState>(preferencesFeatureKey);

export const selectCalmMode = createSelector(selectPreferencesState, (state) => state.calmMode);
export const selectThemeMode = createSelector(selectPreferencesState, (state) => state.themeMode);
export const selectAccent = createSelector(selectPreferencesState, (state) => state.accent);
export const selectDensity = createSelector(selectPreferencesState, (state) => state.density);
export const selectHighContrast = createSelector(
  selectPreferencesState,
  (state) => state.highContrast
);
export const selectPassphraseSet = createSelector(
  selectPreferencesState,
  (state) => state.passphraseSet
);
