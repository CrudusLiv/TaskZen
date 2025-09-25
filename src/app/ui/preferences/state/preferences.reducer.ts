import { createReducer, on } from '@ngrx/store';
import { PreferencesActions, PreferencesState, preferencesFeatureKey } from './preferences.actions';

const initial: PreferencesState = {
  calmMode: false,
  themeMode: 'dark',
  accent: '#7c3aed',
  density: 'comfortable',
  highContrast: false,
  passphraseSet: false,
};

export const preferencesReducer = createReducer(
  initial,
  on(PreferencesActions.toggleCalmMode, (s) => ({ ...s, calmMode: !s.calmMode })),
  on(PreferencesActions.setCalmMode, (s, { value }) => ({ ...s, calmMode: value })),
  on(PreferencesActions.setThemeMode, (s, { mode }) => ({ ...s, themeMode: mode })),
  on(PreferencesActions.setAccent, (s, { accent }) => ({ ...s, accent })),
  on(PreferencesActions.setDensity, (s, { density }) => ({ ...s, density })),
  on(PreferencesActions.setHighContrast, (s, { value }) => ({ ...s, highContrast: value })),
  on(PreferencesActions.setPassphraseFlag, (s, { value }) => ({ ...s, passphraseSet: value })),
  on(PreferencesActions.hydrate, (s, { state }) => ({ ...s, ...state }))
);

export { preferencesFeatureKey };
export type { PreferencesState };
