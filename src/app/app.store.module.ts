import { isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { reducers } from './store/app.state';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { PersistenceEffects } from './core/storage/persistence.effects';
import { CoachEffects } from './ui/coach/state/coach.effects';
import { ItemsActions } from './ui/items/state/items.actions';

export function provideAppStore() {
  return [
    provideStore(reducers),
  provideEffects([PersistenceEffects, CoachEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    // Kick off hydration by dispatching Items Init (others can listen if needed)
    {
      provide: 'APP_INIT_DISPATCH',
      multi: true,
      useFactory: () => {
        return () => ItemsActions.init();
      },
    },
  ];
}
