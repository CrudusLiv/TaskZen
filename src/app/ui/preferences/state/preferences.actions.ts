import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface PreferencesState {
  calmMode: boolean;
  themeMode: 'dark' | 'light' | 'system';
  accent?: string;
  density: 'comfortable' | 'compact';
  highContrast: boolean;
  passphraseSet?: boolean; // future security flag
}

export const preferencesFeatureKey = 'preferences';

export const PreferencesActions = createActionGroup({
  source: 'Preferences',
  events: {
    Init: emptyProps(),
    'Toggle Calm Mode': () => ({ toggling: true as true }),
    'Set Calm Mode': props<{ value: boolean }>(),
    'Set Theme Mode': props<{ mode: PreferencesState['themeMode'] }>(),
    'Set Accent': props<{ accent: string }>(),
    'Set Density': props<{ density: PreferencesState['density'] }>(),
    'Set High Contrast': props<{ value: boolean }>(),
    'Set Passphrase Flag': props<{ value: boolean }>(),
    Hydrate: props<{ state: Partial<PreferencesState> }>(),
  },
});
