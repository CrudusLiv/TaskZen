import { createActionGroup, props } from '@ngrx/store';

export interface PreferencesState {
  calmMode: boolean;
  // future: darkMode, reducedMotion, etc.
}

export const preferencesFeatureKey = 'preferences';

export const PreferencesActions = createActionGroup({
  source: 'Preferences',
  events: {
    'Toggle Calm Mode': () => ({ toggling: true as true }),
    'Set Calm Mode': props<{ value: boolean }>(),
  }
});
