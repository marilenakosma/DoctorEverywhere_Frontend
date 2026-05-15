import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { JwtPayload, UserInfo, UserRole } from '../models/user-identity.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY  = 'current_user';
  private readonly baseUrl   = `${environment.apiUrl}/api/auth`;

  private readonly USE_MOCK = false;

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public  currentUser$       = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  login(payload: LoginRequest): Observable<AuthResponse> {
    if (this.USE_MOCK) return this.mockLogin(payload);

    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, {
      username: payload.username,
      password: payload.password,
    }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => throwError(() => this.extractErrorMessage(err)))
    );
  }

  // ── Register ───────────────────────────────────────────────────────────────

  register(payload: any): Observable<void> {
    if (this.USE_MOCK) return this.mockRegister(payload);

    const isDoctor = payload.role === UserRole.Doctor;
    const url = isDoctor
      ? `${this.baseUrl}/register/doctor`
      : `${this.baseUrl}/register/patient`;

    // Strip role — backend doesn't expect it
    const { role, ...body } = payload;

    return this.http.post<void>(url, body).pipe(
      tap(() => {
        this.login({
          username: payload.username,
          password: payload.password,
        }).subscribe();
      }),
      catchError(err => throwError(() => this.extractErrorMessage(err)))
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.USE_MOCK && token.startsWith('mock.')) return true;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.getValue();
  }

  hasRole(role: UserRole): boolean {
    return this.getCurrentUser()?.role === role;
  }

  // ── Session restore ────────────────────────────────────────────────────────

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) return;

    // Reject mock tokens when USE_MOCK is off
    if (token.startsWith('mock.')) {
      if (!this.USE_MOCK) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      } else {
        const stored = localStorage.getItem(this.USER_KEY);
        if (stored) this.currentUserSubject.next(JSON.parse(stored));
      }
      return;
    }

    try {
      const decoded = jwtDecode<any>(token);
      if (decoded.exp * 1000 > Date.now()) {
        const role = this.extractRole(decoded);
        const user: UserInfo = {
          id:        decoded.sub,
          username:  decoded.unique_name ?? decoded.name ?? '',
          firstName: decoded.given_name  ?? decoded.firstName ?? '',
          lastName:  decoded.family_name ?? decoded.lastName  ?? '',
          role,
        };
        this.currentUserSubject.next(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        // Fetch real name if missing from JWT
        if (!user.firstName) {
          this.fetchAndUpdateName(user);
        }
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  // ── Auth success ───────────────────────────────────────────────────────────

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);

    try {
      const decoded = jwtDecode<any>(res.token);
      const role = this.extractRole(decoded);

      const user: UserInfo = {
        id:        decoded.sub,
        username:  decoded.unique_name ?? decoded.name ?? '',
        firstName: decoded.given_name  ?? decoded.firstName ?? '',
        lastName:  decoded.family_name ?? decoded.lastName  ?? '',
        role,
      };

      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.redirectByRole(role);

      // Fetch real name from API if JWT doesn't include it
      if (!user.firstName) {
        this.fetchAndUpdateName(user);
      }
    } catch (e) {
      console.error('Failed to decode JWT', e);
    }
  }

  // ── Fetch name from API (when JWT doesn't include firstName/lastName) ──────

  private fetchAndUpdateName(user: UserInfo): void {
    if (user.role === UserRole.Patient) {
      this.http.get<any>(`${environment.apiUrl}/api/patient/me`).subscribe({
        next: p => this.updateUserName(user, p.firstName, p.lastName),
        error: () => {
          // fallback — get all patients and take first
          this.http.get<any[]>(`${environment.apiUrl}/api/patient`).subscribe({
            next: patients => {
              if (patients?.length > 0) {
                this.updateUserName(user, patients[0].firstName, patients[0].lastName);
              }
            },
            error: () => {}
          });
        }
      });
    }

    if (user.role === UserRole.Doctor) {
      this.http.get<any>(`${environment.apiUrl}/api/doctor/me`).subscribe({
        next: d => this.updateUserName(user, d.firstName, d.lastName),
        error: () => {}
      });
    }
  }

  private updateUserName(user: UserInfo, firstName: string, lastName: string): void {
    const updated: UserInfo = { ...user, firstName: firstName ?? '', lastName: lastName ?? '' };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  // ── Role extraction ────────────────────────────────────────────────────────

  private extractRole(decoded: any): UserRole {
    const role = decoded.role
      ?? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role as UserRole;
  }

  // ── Redirect by role ───────────────────────────────────────────────────────

  private redirectByRole(role: UserRole): void {
    const routes: Record<UserRole, string> = {
      [UserRole.Patient]: '/patient/dashboard',
      [UserRole.Doctor]:  '/doctor/dashboard',
      [UserRole.Manager]: '/manager/dashboard',
    };
    this.router.navigate([routes[role] ?? '/auth/login']);
  }

  // ── Mock helpers ───────────────────────────────────────────────────────────

  private mockLogin(payload: LoginRequest): Observable<AuthResponse> {
    const role = payload.username.startsWith('doctor')
      ? UserRole.Doctor
      : payload.username.startsWith('manager')
        ? UserRole.Manager
        : UserRole.Patient;

    const user: UserInfo = {
      id: 'mock-1', username: payload.username,
      firstName: 'Test', lastName: 'User', role,
    };
    const mockRes: AuthResponse = { token: `mock.jwt.${role}.token` };
    localStorage.setItem(this.TOKEN_KEY, mockRes.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.redirectByRole(role);
    return of(mockRes);
  }

  private mockRegister(payload: any): Observable<void> {
    const user: UserInfo = {
      id: 'mock-2', username: payload.username,
      firstName: payload.firstName, lastName: payload.lastName, role: payload.role,
    };
    const token = `mock.jwt.${payload.role}.token`;
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.redirectByRole(payload.role);
    return of(void 0);
  }

  private extractErrorMessage(err: any): string {
    return err?.error?.message ?? err?.error ?? err?.message ?? 'An unexpected error occurred.';
  }
}