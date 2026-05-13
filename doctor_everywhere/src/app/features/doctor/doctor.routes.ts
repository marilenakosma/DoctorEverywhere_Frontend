import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DoctorDashboardComponent)
  },
  {
    path: 'requests',
    loadComponent: () => import('./requests/requests.component').then(m => m.DoctorRequestsComponent)
  },
  {
    path: 'appointments',
    loadComponent: () => import('./appointments/appointments.component').then(m => m.DoctorAppointmentsComponent)
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.component').then(m => m.DoctorMessagesComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
