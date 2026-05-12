import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/analytics.component').then(m => m.ManagerAnalyticsComponent)
  },
  { path: '', redirectTo: 'analytics', pathMatch: 'full' }
];
