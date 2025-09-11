import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'kanban' },
	{ path: 'boards', loadComponent: () => import('./ui/boards/dashboard/boards-dashboard.component').then(m => m.BoardsDashboardComponent) },
	{ path: 'kanban', loadComponent: () => import('./ui/kanban/board/board.component').then(m => m.KanbanBoardComponent) },
	{ path: 'tasks', loadComponent: () => import('./ui/tasks/tasks.component').then(m => m.TasksComponent) },
	{ path: 'activity', loadComponent: () => import('./ui/notifications/components/activity-feed/activity-feed.component').then(m => m.ActivityFeedComponent) },
	{ path: 'focus', loadComponent: () => import('./ui/focus/focus.component').then(m => m.FocusComponent) },
	{ path: 'analytics', loadComponent: () => import('./ui/analytics/analytics.component').then(m => m.AnalyticsComponent) },
	{ path: 'auth', loadComponent: () => import('./ui/auth/auth.component').then(m => m.AuthComponent) },
	{ path: 'calendar', loadComponent: () => import('./ui/calendar/calendar.component').then(m => m.CalendarComponent) },
	{ path: 'planner', loadComponent: () => import('./ui/planner/components/planner-page/planner-page.component').then(m => m.PlannerPageComponent) }
];
