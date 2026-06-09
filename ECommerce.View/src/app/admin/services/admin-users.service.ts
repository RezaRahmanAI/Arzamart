import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  allowedMenus?: string[];
  plainPassword?: string;
}

export interface CreateAdminRequest {
  fullName: string;
  email: string;
  userName: string;
  password: string;
  role: 'Admin' | 'SuperAdmin' | 'Staff';
  allowedMenus?: string[];
}

@Injectable({
  providedIn: "root",
})
export class AdminUsersService {
  private readonly api = inject(ApiHttpClient);

  getAdmins(): Observable<AdminUser[]> {
    return this.api.get<AdminUser[]>("/admin/users");
  }

  createAdmin(request: CreateAdminRequest): Observable<AdminUser> {
    return this.api.post<AdminUser>("/admin/users", request);
  }

  toggleActive(userId: string): Observable<any> {
    return this.api.post(`/admin/users/${userId}/toggle-active`, {});
  }

  updateAdmin(userId: string, data: Partial<CreateAdminRequest>): Observable<any> {
    return this.api.put(`/admin/users/${userId}`, data);
  }

  resetPassword(userId: string, newPassword: string): Observable<any> {
    return this.api.post(`/admin/users/${userId}/reset-password`, { newPassword });
  }

  getPassword(userId: string): Observable<{ password: string; message?: string }> {
    return this.api.get<{ password: string; message?: string }>(`/admin/users/${userId}/password`);
  }
}
