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
import { BYPASS_LOGGING } from "../http/tokens";
import { HttpContext } from "@angular/common/http";

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

    // Strict validation: Ignore "null", "undefined", or obviously malformed tokens
    if (this.isValidToken(token)) {
      this.accessToken$.next(token);
    } else if (token) {
      // Clean up junk from localStorage
      this.logout();
      return;
    }

    if (userJson && userJson !== "undefined" && userJson !== "null") {
      try {
        this.currentUser$.next(JSON.parse(userJson));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    // Always verify session on startup if token exists and isn't obviously expired
    const currentToken = this.accessToken$.getValue();
    if (currentToken && this.isLoggedIn()) {
      // Use setTimeout to avoid circular issues during initialization
      setTimeout(() => {
        // Use BYPASS_LOGGING context to ensure console remains clean on startup failures
        const context = new HttpContext().set(BYPASS_LOGGING, true);
        this.checkAuth(context).subscribe();
      }, 0);
    } else if (currentToken) {
      // If token exists but is expired/invalid, clear it to start clean
      this.logout();
    }
  }

  private isValidToken(token: string | null): token is string {
    if (
      !token ||
      token === "null" ||
      token === "undefined" ||
      token.trim() === ""
    ) {
      return false;
    }
    // Basic JWT format check: segments separated by dots
    return token.split(".").length === 3;
  }

  checkAuth(context?: HttpContext): Observable<AuthUser | null> {
    return this.api.get<AuthUser>("/auth/me", { context }).pipe(
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
    if (!this.isValidToken(token)) return false;

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

  private isLoggingOut = false;
  logout(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    this.accessToken$.next(null);
    this.currentUser$.next(null);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.AUTH_USER_KEY);

    // Call logout API but don't wait or handle hard redirect here
    // to avoid interrupting guest flows.
    this.api.post("/auth/logout", {}).subscribe({
      next: () => (this.isLoggingOut = false),
      error: () => (this.isLoggingOut = false),
    });

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
