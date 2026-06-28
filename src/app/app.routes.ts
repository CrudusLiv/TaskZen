import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/navigation/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./ui/items/items-capture/items-capture.component').then(
            (m) => m.ItemsCaptureComponent
          ),
      },
      {
        path: 'items',
        loadComponent: () =>
          import('./ui/items/items-list/items-list.component').then((m) => m.ItemsListComponent),
      },
      {
        path: 'focus',
        loadComponent: () => import('./ui/focus/focus.page').then((m) => m.FocusPage),
      },
      {
        path: 'energy',
        loadComponent: () => import('./ui/energy/energy.page').then((m) => m.EnergyPage),
      },
      {
        path: 'routines',
        loadComponent: () =>
          import('./ui/routines/routines/routines.page').then((m) => m.RoutinesPage),
      },
      {
        path: 'routines/play/:id',
        loadComponent: () =>
          import('./ui/routines/routine-play/routine-play.page').then((m) => m.RoutinePlayPage),
      },
      {
        path: 'coach',
        loadComponent: () => import('./ui/coach/coach.page').then((m) => m.CoachPage),
      },
      {
        path: 'insights',
        loadComponent: () => import('./ui/insights/insights.page').then((m) => m.InsightsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./ui/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'prioritize',
        loadComponent: () =>
          import('./ui/prioritize/prioritize.page').then((m) => m.PrioritizePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
