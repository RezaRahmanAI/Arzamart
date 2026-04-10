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
}

export interface CreateAdminRequest {
  fullName: string;
  email: string;
  userName: string;
  password: string;
  role: 'Admin' | 'SuperAdmin';
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
}
