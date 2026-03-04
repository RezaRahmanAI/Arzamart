import { Injectable, inject, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  tap,
  throwError,
  of,
} from "rxjs";
import { ApiHttpClient } from "../http/http-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  expiresIn?: number;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly injector = inject(Injector);
  private readonly SAVED_EMAIL_KEY = "saved_email";
  private readonly AUTH_TOKEN_KEY = "arza_token";
  private readonly AUTH_USER_KEY = "arza_user";

  // Use a getter for ApiHttpClient to resolve circular dependency if any,
  // though ApiHttpClient is usually fine.
  private _api?: ApiHttpClient;
  get api(): ApiHttpClient {
    if (!this._api) {
      this._api = this.injector.get(ApiHttpClient);
    }
    return this._api;
  }

  // Memory-only state
  private readonly accessToken$ = new BehaviorSubject<string | null>(null);
  private readonly currentUser$ = new BehaviorSubject<AuthUser | null>(null);

  currentUser = this.currentUser$.asObservable();

  constructor() {
    this.hydrateSession();
  }

  private hydrateSession(): void {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const userJson = localStorage.getItem(this.AUTH_USER_KEY);

    if (token) {
      this.accessToken$.next(token);
    }
    if (userJson) {
      try {
        this.currentUser$.next(JSON.parse(userJson));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    // Always verify session on startup if token exists
    if (token) {
      // Use setTimeout to avoid circular issues during initialization if any
      setTimeout(() => {
        this.checkAuth().subscribe();
      }, 0);
    }
  }

  checkAuth(): Observable<AuthUser | null> {
    return this.api.get<AuthUser>("/auth/me").pipe(
      tap((user) => {
        this.currentUser$.next(user);
        localStorage.setItem(this.AUTH_USER_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  adminLogin(email: string, password: string): Observable<AuthSession> {
    return this.api
      .post<AuthSession>("/auth/login", {
        email: email.trim(),
        password,
      })
      .pipe(
        tap((session) => {
          this.setSession(session);

          // Trigger cart merge
          import("./cart.service")
            .then((m) => {
              const cartService = this.injector.get(m.CartService);
              cartService.mergeGuestCart().subscribe();
            })
            .catch((e) => console.error(e));
        }),
        catchError((error) =>
          this.handleAuthError(error, "Invalid credentials"),
        ),
      );
  }

  customerPhoneLogin(phone: string): Observable<AuthSession> {
    return this.api
      .post<AuthSession>("/auth/customer/login", {
        phone: phone.trim(),
      })
      .pipe(
        tap((session) => {
          this.setSession(session);

          // Trigger cart merge
          import("./cart.service")
            .then((m) => {
              const cartService = this.injector.get(m.CartService);
              cartService.mergeGuestCart().subscribe();
            })
            .catch((e) => console.error(e));
        }),
        catchError((error) =>
          this.handleAuthError(error, "Invalid phone number"),
        ),
      );
  }

  setSession(session: AuthSession): void {
    if (session.accessToken) {
      this.accessToken$.next(session.accessToken);
      localStorage.setItem(this.AUTH_TOKEN_KEY, session.accessToken);
    }
    this.currentUser$.next(session.user);
    localStorage.setItem(this.AUTH_USER_KEY, JSON.stringify(session.user));
  }

  getAccessToken(): string | null {
    return this.accessToken$.getValue();
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }

  getRole(): string {
    return this.currentUser$.getValue()?.role ?? "user";
  }

  getSavedEmail(): string | null {
    return localStorage.getItem(this.SAVED_EMAIL_KEY);
  }

  saveEmail(email: string): void {
    localStorage.setItem(this.SAVED_EMAIL_KEY, email);
  }

  clearSavedEmail(): void {
    localStorage.removeItem(this.SAVED_EMAIL_KEY);
  }

  updateCurrentUser(user: Partial<AuthUser>): void {
    const current = this.currentUser$.getValue();
    if (current) {
      this.currentUser$.next({ ...current, ...user });
    }
  }

  currentUserSnapshot(): AuthUser | null {
    return this.currentUser$.getValue();
  }

  logout(): void {
    this.accessToken$.next(null);
    this.currentUser$.next(null);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.AUTH_USER_KEY);

    // Call logout API but don't wait or handle hard redirect here
    // to avoid interrupting guest flows.
    this.api.post("/auth/logout", {}).subscribe();

    // Use the router for a cleaner navigation to home page instead of hard redirect to login
    const router = this.injector.get(Router);
    void router.navigateByUrl("/");
  }

  private handleAuthError(
    error: any,
    fallbackMessage: string,
  ): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const message = this.getErrorMessage(error) ?? fallbackMessage;
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private getErrorMessage(error: HttpErrorResponse): string | null {
    const apiError = error.error;

    if (typeof apiError === "string") {
      return apiError;
    }

    if (apiError?.message) {
      return apiError.message as string;
    }

    return null;
  }
}
