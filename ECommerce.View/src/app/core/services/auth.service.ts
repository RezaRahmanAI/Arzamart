import { DestroyRef, Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BehaviorSubject, catchError, map, Observable, of, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiHttpClient } from "../http/http-client";
import { AuthResponse, LoginPayload, User } from "../models/entities";
import { StorageKeys } from "../constants/storage-keys";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser = this.userSubject.asObservable();
  isLoggedIn$ = this.currentUser.pipe(map((user) => !!user));

  api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.hydrateSession();
  }

  private hydrateSession() {
    if (!isPlatformBrowser(this.platformId)) return;
    const stored = localStorage.getItem(StorageKeys.CURRENT_USER);
    if (stored) {
      try {
        this.userSubject.next(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    const token = localStorage.getItem(StorageKeys.AUTH_TOKEN);
    if (token) {
      this.api.get<User>("/auth/me").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (user) => this.setSession(user, token),
        error: () => this.clearSession(),
      });
    }
  }

  login(identifier: string, password: string, rememberMe = true): Observable<User | null> {
    const payload: LoginPayload = { identifier, password, rememberMe };
    return this.api.post<AuthResponse>("/auth/login", payload).pipe(
      tap((response) => {
        this.setSession(response.user, response.token);
        if (response.refreshToken) {
          localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
        }
      }),
      map((response) => response.user),
    );
  }

  logout(): void {
    this.clearSession();
    this.api.post("/auth/logout", {}).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  refreshToken(): Observable<User | null> {
    const refreshToken = localStorage.getItem(StorageKeys.REFRESH_TOKEN);
    if (!refreshToken) {
      return of(null);
    }
    return this.api.post<AuthResponse>("/auth/refresh", { refreshToken }).pipe(
      tap((response) => {
        this.setSession(response.user, response.token);
        if (response.refreshToken) {
          localStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
        }
      }),
      map((response) => response.user),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>("/auth/change-password", { currentPassword, newPassword });
  }

  setSession(user: User, token: string) {
    this.userSubject.next(user);
    localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(user));
    if (token) {
      localStorage.setItem(StorageKeys.AUTH_TOKEN, token);
    }
  }

  private clearSession() {
    this.userSubject.next(null);
    localStorage.removeItem(StorageKeys.CURRENT_USER);
    localStorage.removeItem(StorageKeys.AUTH_TOKEN);
    localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(StorageKeys.AUTH_TOKEN);
  }

  getCurrentUser() {
    return this.userSubject.value;
  }

  isAdmin() {
    const role = this.userSubject.value?.role;
    return role === "Admin" || role === "SuperAdmin" || role === "Super Admin" || role === "Manager" || role === "Viewer" || role === "Staff";
  }

  isSuperAdmin() {
    const role = this.userSubject.value?.role;
    return role === "SuperAdmin" || role === "Super Admin";
  }

  isAuthenticated() {
    return !!this.userSubject.value;
  }

  // Compatibility Methods
  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getRole(): string | undefined {
    return this.userSubject.value?.role;
  }

  customerPhoneLogin(phone: string): Observable<User | null> {
    if (!phone || !phone.trim()) {
      return of(null);
    }
    return this.api.post<{ accessToken: string; user: User }>("/auth/customer-login", { phone }).pipe(
      tap((response) => {
        if (response && response.accessToken) {
          response.user.phoneNumber = phone;
          this.setSession(response.user, response.accessToken);
          localStorage.setItem(StorageKeys.CUSTOMER_PHONE, phone);
        }
      }),
      map((response) => response.user),
      catchError((error) => {
        console.error("Customer phone login failed", error);
        return of(null);
      })
    );
  }

  saveEmail(email: string): void {
    localStorage.setItem(StorageKeys.SAVED_EMAIL, email);
  }

  getSavedEmail(): string | null {
    return localStorage.getItem(StorageKeys.SAVED_EMAIL);
  }

  clearSavedEmail(): void {
    localStorage.removeItem(StorageKeys.SAVED_EMAIL);
  }

  updateCurrentUser(partial: Partial<User>): void {
    const current = this.userSubject.value;
    if (current) {
      const updated = { ...current, ...partial };
      // Ensure name and fullName stay in sync if one is provided
      if (partial.name && !partial.fullName) updated.fullName = partial.name;
      if (partial.fullName && !partial.name) updated.name = partial.fullName;

      this.setSession(updated, this.getAccessToken() || "");
    }
  }

  currentUserSnapshot(): User | null {
    return this.userSubject.value;
  }
}

