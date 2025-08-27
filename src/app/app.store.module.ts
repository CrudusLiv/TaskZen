import { importProvidersFrom, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { reducers } from './store/app.state';
import { provideEffects } from '@ngrx/effects';
// Removed legacy tasks feature
import { BoardEffects } from './kanban/state/board.effects';
import { BoardsEffects } from './boards/boards.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export function provideAppStore() {
  return [
    provideStore(reducers),
  provideEffects([BoardEffects, BoardsEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ];
}
