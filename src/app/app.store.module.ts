import { importProvidersFrom, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { reducers } from './store/app.state';
import { provideEffects } from '@ngrx/effects';
// Removed legacy tasks feature
import { BoardEffects } from './kanban/state/board.effects';
import { BoardFirestoreEffects } from './kanban/state/board.firestore.effects';
import { BoardsEffects } from './boards/boards.effects';
import { AuthEffects } from './auth/state/auth.effects';
import { TasksEffects } from './tasks/state/tasks.effects';
import { AppEffects } from './store/app.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export function provideAppStore() {
  return [
    provideStore(reducers),
  provideEffects([BoardEffects, BoardFirestoreEffects, BoardsEffects, AuthEffects, TasksEffects, AppEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ];
}
