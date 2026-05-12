import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { UserInfo, UserRole } from '../../shared/models/user-identity.model';

// ── Helper: get user from service OR directly from localStorage ───────────────
function resolveUser(auth: AuthService): UserInfo | null {
  const fromService = auth.getCurrentUser();
  if (fromService) return fromService;

  // Fallback: read directly from localStorage (handles post-redirect timing)
  const stored = localStorage.getItem('mock_user');
  if (stored) {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return null;
}

// ── Auth guard — any authenticated user ───────────────────────────────────────
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/auth/login']);
  return false;
};

// ── Role guard — specific role required ───────────────────────────────────────
export const roleGuard = (allowedRole: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    const user = resolveUser(auth);

    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (user.role === allowedRole) return true;

    // Authenticated but wrong role — redirect to their own dashboard
    const routes: Record<UserRole, string> = {
      [UserRole.Patient]: '/patient/dashboard',
      [UserRole.Doctor]: '/doctor/dashboard',
      [UserRole.Manager]: '/manager/dashboard',
    };
    router.navigate([routes[user.role] ?? '/auth/login']);
    return false;
  };
};

// ── Public guard — redirects logged-in users away from auth pages ─────────────
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  const user = resolveUser(auth);
  if (user) {
    const routes: Record<UserRole, string> = {
      [UserRole.Patient]: '/patient/dashboard',
      [UserRole.Doctor]:  '/doctor/dashboard',
      [UserRole.Manager]: '/manager/dashboard',
    };
    router.navigate([routes[user.role]]);
    return false;
  }

  return true;
};
