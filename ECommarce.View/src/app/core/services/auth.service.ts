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

  api = inject(ApiHttpClient);

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
    const role = this.userSubject.value?.role;
    return role === "Admin" || role === "SuperAdmin" || role === "Super Admin" || role === "Manager" || role === "Viewer";
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

  adminLogin(emailOrUsername: string, password: string): Observable<User | null> {
    const payload = { username: emailOrUsername, password };
    return this.api.post<any>("/staff/auth/login", payload).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const rawUser = response.data.user;
          
          // Map permissions to old menu keys for compatibility
          const allowedMenus: string[] = [];
          const permissions: string[] = rawUser.permissions || [];

          if (rawUser.isSuperAdmin) {
            allowedMenus.push("dashboard", "products", "orders", "customers", "analytics", "settings", "banners", "navigation", "pages", "reviews", "order-sources", "security", "users");
          } else {
            if (permissions.some(p => p.startsWith("inventory:"))) allowedMenus.push("products");
            if (permissions.some(p => p.startsWith("sales:"))) {
              allowedMenus.push("orders");
              allowedMenus.push("banners");
              allowedMenus.push("reviews");
            }
            if (permissions.some(p => p.startsWith("hr:"))) allowedMenus.push("customers");
            if (permissions.some(p => p.startsWith("reports:"))) allowedMenus.push("analytics");
            if (permissions.some(p => p.startsWith("settings:"))) {
              allowedMenus.push("settings");
              allowedMenus.push("navigation");
              allowedMenus.push("pages");
              allowedMenus.push("order-sources");
              allowedMenus.push("security");
            }
            if (permissions.some(p => p.startsWith("staff-management:"))) allowedMenus.push("users");
          }

          const user: User = {
            id: rawUser.id,
            fullName: rawUser.fullName,
            userName: rawUser.username,
            email: rawUser.email,
            role: rawUser.role,
            allowedMenus: allowedMenus
          };
          this.setSession(user, response.data.accessToken);
          localStorage.setItem("arza_refresh_token", response.data.refreshToken);
        }
      }),
      map((response) => {
        if (response.success && response.data) {
          const rawUser = response.data.user;
          const allowedMenus: string[] = [];
          const permissions: string[] = rawUser.permissions || [];

          if (rawUser.isSuperAdmin) {
            allowedMenus.push("dashboard", "products", "orders", "customers", "analytics", "settings", "banners", "navigation", "pages", "reviews", "order-sources", "security", "users");
          } else {
            if (permissions.some(p => p.startsWith("inventory:"))) allowedMenus.push("products");
            if (permissions.some(p => p.startsWith("sales:"))) {
              allowedMenus.push("orders");
              allowedMenus.push("banners");
              allowedMenus.push("reviews");
            }
            if (permissions.some(p => p.startsWith("hr:"))) allowedMenus.push("customers");
            if (permissions.some(p => p.startsWith("reports:"))) allowedMenus.push("analytics");
            if (permissions.some(p => p.startsWith("settings:"))) {
              allowedMenus.push("settings");
              allowedMenus.push("navigation");
              allowedMenus.push("pages");
              allowedMenus.push("order-sources");
              allowedMenus.push("security");
            }
            if (permissions.some(p => p.startsWith("staff-management:"))) allowedMenus.push("users");
          }

          return {
            id: rawUser.id,
            fullName: rawUser.fullName,
            userName: rawUser.username,
            email: rawUser.email,
            role: rawUser.role,
            allowedMenus: allowedMenus
          };
        }
        return null;
      })
    );
  }

  customerPhoneLogin(phone: string): Observable<User | null> {
    // For MVP/Guest checkout, we might just "identify" them or do a silent login
    // If backend doesn't have a specific endpoint, we can use a mock or a simple me call
    return this.api.get<User>(`/customers/lookup?phone=${phone}`).pipe(
      tap((user) => {
        if (user) {
          this.setSession(user, this.getAccessToken() || "");
        }
      }),
    );
  }

  saveEmail(email: string): void {
    localStorage.setItem("arza-saved-email", email);
  }

  getSavedEmail(): string | null {
    return localStorage.getItem("arza-saved-email");
  }

  clearSavedEmail(): void {
    localStorage.removeItem("arza-saved-email");
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

