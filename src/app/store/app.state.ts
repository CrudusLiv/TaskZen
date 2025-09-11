import { ActionReducerMap } from '@ngrx/store';
// Removed legacy tasks feature
import { boardFeatureKey, boardReducer } from '../ui/kanban/state/board.reducer';
import { boardsFeatureKey, boardsReducer } from '../ui/boards/state/boards.reducer';
import { notificationsFeatureKey, notificationsReducer } from '../ui/notifications/state/notifications.reducer';
import { focusFeatureKey, FocusState, focusReducer } from '../ui/focus/state/focus.reducer';
import { analyticsFeatureKey, AnalyticsState, analyticsReducer } from '../ui/analytics/state/analytics.reducer';
import { authFeatureKey, AuthState, authReducer } from '../ui/auth/state/auth.reducer';
import { tasksFeatureKey, tasksReducer, TasksState } from '../ui/tasks/state/tasks.reducer';
import { plannerFeatureKey } from '../ui/planner/state/planner.models';
import { plannerReducer } from '../ui/planner/state/planner.reducer';
import { calendarFeatureKey } from '../ui/calendar/state/calendar.models';
import { calendarReducer } from '../ui/calendar/state/calendar.reducer';

export interface AppState {
  // tasks removed
  [boardFeatureKey]: any;
  [boardsFeatureKey]: any;
  [notificationsFeatureKey]: any;
  [focusFeatureKey]: FocusState;
  [analyticsFeatureKey]: AnalyticsState;
  [authFeatureKey]: AuthState;
  [tasksFeatureKey]: TasksState;
  [plannerFeatureKey]: any;
  [calendarFeatureKey]: any;
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
  , [plannerFeatureKey]: plannerReducer
  , [calendarFeatureKey]: calendarReducer
};
