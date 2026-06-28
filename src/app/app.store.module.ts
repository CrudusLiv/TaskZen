import { APP_INITIALIZER, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { reducers } from './store/app.state';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { PersistenceEffects } from './core/storage/persistence.effects';
import { CoachEffects } from './ui/coach/state/coach.effects';
import { Store } from '@ngrx/store';
import { ItemsActions } from './ui/items/state/items.actions';
import { FocusActions } from './ui/focus/state/focus.actions';
import { EnergyActions } from './ui/energy/state/energy.actions';
import { RoutinesActions } from './ui/routines/state/routines.actions';
import { CoachActions } from './ui/coach/state/coach.actions';
import { PreferencesActions } from './ui/preferences/state/preferences.actions';

export function provideAppStore() {
  return [
    provideStore(reducers),
    provideEffects([PersistenceEffects, CoachEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    // Dispatch init actions for all slices so each slice hydrates from IndexedDB on startup
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (store: Store) => {
        return () => {
          store.dispatch(ItemsActions.init());
          store.dispatch(FocusActions.init());
          store.dispatch(EnergyActions.init());
          store.dispatch(RoutinesActions.init());
          store.dispatch(CoachActions.init());
          store.dispatch(PreferencesActions.init());
        };
      },
      deps: [Store],
    },
  ];
}
