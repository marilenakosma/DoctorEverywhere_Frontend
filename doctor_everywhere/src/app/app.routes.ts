import { Routes } from '@angular/router';
import { AppLayoutComponent } from './core/app-layout/app-layout';
import { roleGuard } from './core/guards/auth.guard';
import { UserRole } from './shared/models/user-identity.model';

export const APP_ROUTES: Routes = [
  // ── Auth (public) ──────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ── Protected Domain Routes ───────────────────────────────────────────
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: 'patient',
        canActivate: [roleGuard(UserRole.Patient)],
        loadChildren: () =>
          import('./features/patient/patient.routes').then(
            (m) => m.PATIENT_ROUTES
          ),
      },
      {
        path: 'doctor',
        canActivate: [roleGuard(UserRole.Doctor)],
        loadChildren: () =>
          import('./features/doctor/doctor.routes').then(
            (m) => m.DOCTOR_ROUTES
          ),
      },
      {
        path: 'manager',
        canActivate: [roleGuard(UserRole.Manager)],
        loadChildren: () =>
          import('./features/manager/manager.routes').then(
            (m) => m.MANAGER_ROUTES
          ),
      },
      {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full',
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'auth/login' },
];