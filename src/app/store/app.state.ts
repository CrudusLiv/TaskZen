import { ActionReducerMap } from '@ngrx/store';
import {
  preferencesFeatureKey,
  preferencesReducer,
  PreferencesState,
} from '../ui/preferences/state/preferences.reducer';
import { itemsFeatureKey, itemsReducer, ItemsState } from '../ui/items/state/items.reducer';
import { focusFeatureKey, focusReducer, FocusSessionState } from '../ui/focus/state/focus.reducer';
import { energyFeatureKey } from '../ui/energy/state/energy.actions';
import { energyReducer, EnergyState } from '../ui/energy/state/energy.reducer';
import { routinesFeatureKey } from '../ui/routines/state/routines.actions';
import { routinesReducer, RoutinesState } from '../ui/routines/state/routines.reducer';

export interface AppState {
  [preferencesFeatureKey]: PreferencesState;
  [itemsFeatureKey]: ItemsState;
  [focusFeatureKey]: FocusSessionState;
  [energyFeatureKey]: EnergyState;
  [routinesFeatureKey]: RoutinesState;
}

export const reducers: ActionReducerMap<AppState> = {
  [preferencesFeatureKey]: preferencesReducer,
  [itemsFeatureKey]: itemsReducer,
  [focusFeatureKey]: focusReducer,
  [energyFeatureKey]: energyReducer,
  [routinesFeatureKey]: routinesReducer,
};
