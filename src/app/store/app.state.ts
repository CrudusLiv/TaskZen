import { ActionReducerMap } from '@ngrx/store';
// Removed legacy tasks feature
import { boardFeatureKey, boardReducer } from '../kanban/state/board.reducer';
import { boardsFeatureKey, boardsReducer } from '../boards/boards.reducer';
import { notificationsFeatureKey, notificationsReducer } from '../notifications/notifications.reducer';
import { focusFeatureKey, FocusState, focusReducer } from '../focus/state/focus.reducer';
import { analyticsFeatureKey, AnalyticsState, analyticsReducer } from '../analytics/state/analytics.reducer';
import { authFeatureKey, AuthState, authReducer } from '../auth/state/auth.reducer';
import { tasksFeatureKey, tasksReducer, TasksState } from '../tasks/state/tasks.reducer';

export interface AppState {
  // tasks removed
  [boardFeatureKey]: any;
  [boardsFeatureKey]: any;
  [notificationsFeatureKey]: any;
  [focusFeatureKey]: FocusState;
  [analyticsFeatureKey]: AnalyticsState;
  [authFeatureKey]: AuthState;
  [tasksFeatureKey]: TasksState;
}

export const reducers: ActionReducerMap<AppState> = {
  // tasks removed
  [boardFeatureKey]: boardReducer,
  [boardsFeatureKey]: boardsReducer,
  [notificationsFeatureKey]: notificationsReducer,
  [focusFeatureKey]: focusReducer,
  [analyticsFeatureKey]: analyticsReducer,
  [authFeatureKey]: authReducer
  , [tasksFeatureKey]: tasksReducer
};
