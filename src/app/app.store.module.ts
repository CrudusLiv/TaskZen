import { importProvidersFrom, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { reducers } from './store/app.state';
import { provideEffects } from '@ngrx/effects';
// Removed legacy tasks feature
import { BoardEffects } from './ui/kanban/state/board.effects';
import { BoardFirestoreEffects } from './ui/kanban/state/board.firestore.effects';
import { BoardsEffects } from './ui/boards/state/boards.effects';
import { AuthEffects } from './ui/auth/state/auth.effects';
import { TasksEffects } from './ui/tasks/state/tasks.effects';
import { AppEffects } from './store/app.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { PlannerEffects } from './ui/planner/state/planner.effects';
import { CalendarEffects } from './ui/calendar/state/calendar.effects';

export function provideAppStore() {
  return [
    provideStore(reducers),
  provideEffects([BoardEffects, BoardFirestoreEffects, BoardsEffects, AuthEffects, TasksEffects, AppEffects, PlannerEffects, CalendarEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ];
}
