import { ActionReducerMap } from '@ngrx/store';
import {
  preferencesFeatureKey,
  preferencesReducer,
  PreferencesState,
} from '../ui/preferences/state/preferences.reducer';
import { itemsFeatureKey, itemsReducer, ItemsState } from '../ui/items/state/items.reducer';
import { focusFeatureKey, focusReducer, FocusSessionState } from '../ui/focus/state/focus.reducer';

export interface AppState {
  [preferencesFeatureKey]: PreferencesState;
  [itemsFeatureKey]: ItemsState;
  [focusFeatureKey]: FocusSessionState;
}

export const reducers: ActionReducerMap<AppState> = {
  [preferencesFeatureKey]: preferencesReducer,
  [itemsFeatureKey]: itemsReducer,
  [focusFeatureKey]: focusReducer,
};
