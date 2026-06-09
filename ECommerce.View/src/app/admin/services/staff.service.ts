import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface StaffUserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  forceChangePassword?: boolean;
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  createdAt: string;
  staffCount: number;
}

export interface ModulePermissionDto {
  id: string;
  action: string;
}

export interface ModuleDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: ModulePermissionDto[];
}

export interface AuditLogDto {
  id: string;
  actorId?: string;
  actorName: string;
  actorUsername: string;
  action: string;
  targetStaffId?: string;
  targetStaffName?: string;
  details?: string;
  createdAt: string;
}

@Injectable({
  providedIn: "root",
})
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);

  private buildUrl(path: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }

  // Staff CRUD
  getStaffUsers(params?: { search?: string; roleId?: string; isActive?: boolean; page?: number; pageSize?: number }): Observable<ApiResponse<PaginatedResponse<StaffUserDto>>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) {
        httpParams = httpParams.set("search", params.search);
      }
      if (params.roleId) {
        httpParams = httpParams.set("roleId", params.roleId);
      }
      if (params.isActive !== undefined && params.isActive !== null) {
        httpParams = httpParams.set("isActive", params.isActive.toString());
      }
      if (params.page !== undefined && params.page !== null) {
        httpParams = httpParams.set("page", params.page.toString());
      }
      if (params.pageSize !== undefined && params.pageSize !== null) {
        httpParams = httpParams.set("pageSize", params.pageSize.toString());
      }
    }
    const refreshHeaders = new HttpHeaders().set("X-Refresh", "true");
    return this.http.get<ApiResponse<PaginatedResponse<StaffUserDto>>>(this.buildUrl("/staff/users"), { params: httpParams, headers: refreshHeaders });
  }

  getStaffUser(id: string): Observable<ApiResponse<StaffUserDto>> {
    return this.http.get<ApiResponse<StaffUserDto>>(this.buildUrl(`/staff/users/${id}`), { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  createStaff(data: any): Observable<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>(this.buildUrl("/staff/users"), data);
  }

  updateStaff(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(this.buildUrl(`/staff/users/${id}`), data);
  }

  toggleStatus(id: string, isActive: boolean): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(this.buildUrl(`/staff/users/${id}/status`), { isActive });
  }

  deleteStaff(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(this.buildUrl(`/staff/users/${id}`));
  }

  viewPassword(id: string): Observable<ApiResponse<{ password: string }>> {
    return this.http.get<ApiResponse<{ password: string }>>(this.buildUrl(`/staff/users/${id}/password`), { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  resetPassword(id: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.buildUrl(`/staff/users/${id}/reset-password`), { password: newPassword });
  }

  // Roles
  getRoles(): Observable<ApiResponse<RoleDto[]>> {
    return this.http.get<ApiResponse<RoleDto[]>>(this.buildUrl("/staff/roles"), { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  createRole(data: { name: string; description?: string }): Observable<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>(this.buildUrl("/staff/roles"), data);
  }

  updateRole(id: string, data: { name: string; description?: string }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(this.buildUrl(`/staff/roles/${id}`), data);
  }

  deleteRole(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(this.buildUrl(`/staff/roles/${id}`));
  }

  getRolePermissions(roleId: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(this.buildUrl(`/staff/roles/${roleId}/permissions`), { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(this.buildUrl(`/staff/roles/${roleId}/permissions`), { permissionIds });
  }

  // Modules (Read-only)
  getModules(): Observable<ApiResponse<ModuleDto[]>> {
    return this.http.get<ApiResponse<ModuleDto[]>>(this.buildUrl("/staff/modules"), { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  // Audit Logs
  getAuditLogs(params?: { actorId?: string; action?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }): Observable<ApiResponse<PaginatedResponse<AuditLogDto>>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.actorId) {
        httpParams = httpParams.set("actorId", params.actorId);
      }
      if (params.action) {
        httpParams = httpParams.set("action", params.action);
      }
      if (params.startDate) {
        httpParams = httpParams.set("startDate", params.startDate);
      }
      if (params.endDate) {
        httpParams = httpParams.set("endDate", params.endDate);
      }
      if (params.page !== undefined && params.page !== null) {
        httpParams = httpParams.set("page", params.page.toString());
      }
      if (params.pageSize !== undefined && params.pageSize !== null) {
        httpParams = httpParams.set("pageSize", params.pageSize.toString());
      }
    }
    return this.http.get<ApiResponse<PaginatedResponse<AuditLogDto>>>(this.buildUrl("/staff/audit-log"), { params: httpParams, headers: new HttpHeaders().set("X-Refresh", "true") });
  }
}

