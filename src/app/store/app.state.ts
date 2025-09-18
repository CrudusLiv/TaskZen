import { ActionReducerMap } from '@ngrx/store';
import { preferencesFeatureKey, preferencesReducer, PreferencesState } from '../ui/preferences/state/preferences.reducer';
import { itemsFeatureKey, itemsReducer, ItemsState } from '../ui/items/state/items.reducer';

export interface AppState {
  [preferencesFeatureKey]: PreferencesState;
  [itemsFeatureKey]: ItemsState;
}

export const reducers: ActionReducerMap<AppState> = {
  [preferencesFeatureKey]: preferencesReducer,
  [itemsFeatureKey]: itemsReducer
};
