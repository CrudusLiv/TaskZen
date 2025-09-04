import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'kanban' },
	{ path: 'boards', loadComponent: () => import('./boards/dashboard/boards-dashboard.component').then(m => m.BoardsDashboardComponent) },
	{ path: 'kanban', loadComponent: () => import('./kanban/board/board.component').then(m => m.KanbanBoardComponent) },
	{ path: 'tasks', loadComponent: () => import('./tasks/tasks.component').then(m => m.TasksComponent) },
	{ path: 'activity', loadComponent: () => import('./notifications/activity-feed.component').then(m => m.ActivityFeedComponent) },
	{ path: 'focus', loadComponent: () => import('./focus/focus.component').then(m => m.FocusComponent) },
	{ path: 'analytics', loadComponent: () => import('./analytics/analytics.component').then(m => m.AnalyticsComponent) },
	{ path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
	{ path: 'calendar', loadComponent: () => import('./calendar/calendar.component').then(m => m.CalendarComponent) },
	{ path: 'planner', loadComponent: () => import('./planner/components/planner-page/planner-page.component').then(m => m.PlannerPageComponent) }
];
