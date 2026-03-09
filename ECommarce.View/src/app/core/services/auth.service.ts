import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of, tap } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { AuthResponse, LoginPayload, User } from "../models/entities";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser = this.userSubject.asObservable();
  isLoggedIn$ = this.currentUser.pipe(map((user) => !!user));

  private currentUserKey = "arza-user";
  private tokenKey = "arza_token";

  private api = inject(ApiHttpClient);

  constructor() {
    this.hydrateSession();
  }

  private hydrateSession() {
    const stored = localStorage.getItem(this.currentUserKey);
    if (stored) {
      try {
        this.userSubject.next(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.api.get<User>("/auth/me").subscribe({
        next: (user) => this.setSession(user, token),
        error: () => this.clearSession(),
      });
    }
  }

  login(identifier: string, password: string, rememberMe = true): Observable<User | null> {
    const payload: LoginPayload = { identifier, password, rememberMe };
    return this.api.post<AuthResponse>("/auth/login", payload).pipe(
      tap((response) => this.setSession(response.user, response.token)),
      map((response) => response.user),
      catchError(() => of(null)),
    );
  }

  logout(): void {
    this.api.post("/auth/logout", {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
    this.clearSession();
  }

  setSession(user: User, token: string) {
    this.userSubject.next(user);
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private clearSession() {
    this.userSubject.next(null);
    localStorage.removeItem(this.currentUserKey);
    localStorage.removeItem(this.tokenKey);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser() {
    return this.userSubject.value;
  }

  isAdmin() {
    return this.userSubject.value?.role === "Admin";
  }

  isAuthenticated() {
    return !!this.userSubject.value;
  }

  // Helper for existing components that might use currentUserSnapshot
  currentUserSnapshot(): User | null {
    return this.userSubject.value;
  }
}

