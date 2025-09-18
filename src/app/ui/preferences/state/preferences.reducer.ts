import { createReducer, on } from '@ngrx/store';
import { PreferencesActions, PreferencesState, preferencesFeatureKey } from './preferences.actions';

const initial: PreferencesState = {
  calmMode: false
};

export const preferencesReducer = createReducer(
  initial,
  on(PreferencesActions.toggleCalmMode, (s)=> ({ ...s, calmMode: !s.calmMode })),
  on(PreferencesActions.setCalmMode, (s,{ value })=> ({ ...s, calmMode: value }))
);

export { preferencesFeatureKey };
export type { PreferencesState };
