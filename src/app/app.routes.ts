import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./ui/items/items-capture/items-capture.component').then(m => m.ItemsCaptureComponent) },
  { path: 'list', loadComponent: () => import('./ui/items/items-list/items-list.component').then(m => m.ItemsListComponent) },
  { path: '**', redirectTo: '' }
];
