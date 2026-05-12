import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { JwtPayload, UserInfo, UserRole } from '../models/user-identity.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;
  private readonly USE_MOCK = true;

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    if (this.USE_MOCK) return this.mockLogin(payload);
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => throwError(() => this.extractErrorMessage(err)))
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    if (this.USE_MOCK) return this.mockRegister(payload);
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => throwError(() => this.extractErrorMessage(err)))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('mock_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

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

  private mockLogin(payload: LoginRequest): Observable<AuthResponse> {
    const role = payload.email.startsWith('doctor')
      ? UserRole.Doctor
      : payload.email.startsWith('manager')
        ? UserRole.Manager
        : UserRole.Patient;

    const mockResponse: AuthResponse = {
      token: `mock.jwt.${role}.token`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { id: 'mock-user-1', email: payload.email, firstName: 'Test', lastName: 'User', role },
    };
    return of(mockResponse).pipe(tap(res => this.handleAuthSuccess(res)));
  }

  private mockRegister(payload: RegisterRequest): Observable<AuthResponse> {
    const mockResponse: AuthResponse = {
      token: `mock.jwt.${payload.role}.token`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { id: 'mock-user-2', email: payload.email, firstName: payload.firstName, lastName: payload.lastName, role: payload.role },
    };
    return of(mockResponse).pipe(tap(res => this.handleAuthSuccess(res)));
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem('mock_user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    this.redirectByRole(res.user.role);
  }

  private redirectByRole(role: UserRole): void {
    const routes: Record<UserRole, string> = {
      [UserRole.Patient]: '/patient/dashboard',
      [UserRole.Doctor]:  '/doctor/dashboard',
      [UserRole.Manager]: '/manager/dashboard',
    };
    this.router.navigate([routes[role] ?? '/']);
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) return;

    if (this.USE_MOCK && token.startsWith('mock.')) {
      const stored = localStorage.getItem('mock_user');
      if (stored) this.currentUserSubject.next(JSON.parse(stored));
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp * 1000 > Date.now()) {
        this.currentUserSubject.next({
          id: decoded.sub, email: decoded.email,
          firstName: decoded.firstName, lastName: decoded.lastName, role: decoded.role,
        });
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  private extractErrorMessage(err: any): string {
    return err?.error?.message ?? err?.error?.title ?? 'An unexpected error occurred.';
  }
}
