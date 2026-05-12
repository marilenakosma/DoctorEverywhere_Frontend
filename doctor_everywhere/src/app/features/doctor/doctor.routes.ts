import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DoctorDashboardComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
