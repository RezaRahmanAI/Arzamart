import { Injectable, inject } from "@angular/core";
import { HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

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

export interface StaffUserListResult {
  items: StaffUserDto[];
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
  private readonly api = inject(ApiHttpClient);

  getStaffUsers(params?: { search?: string; roleId?: string; isActive?: boolean; page?: number; pageSize?: number }): Observable<StaffUserListResult> {
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
    return this.api.get<StaffUserListResult>("/staff/users", { params: httpParams, headers: refreshHeaders });
  }

  getStaffUser(id: string): Observable<ApiResponse<StaffUserDto>> {
    return this.api.get<ApiResponse<StaffUserDto>>(`/staff/users/${id}`, { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  createStaff(data: any): Observable<ApiResponse<{ id: string }>> {
    return this.api.post<ApiResponse<{ id: string }>>("/staff/users", data);
  }

  updateStaff(id: string, data: any): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`/staff/users/${id}`, data);
  }

  toggleStatus(id: string, isActive: boolean): Observable<ApiResponse<any>> {
    return this.api.patch<ApiResponse<any>>(`/staff/users/${id}/status`, { isActive });
  }

  deleteStaff(id: string): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`/staff/users/${id}`);
  }

  viewPassword(id: string): Observable<ApiResponse<{ password: string }>> {
    return this.api.post<ApiResponse<{ password: string }>>(`/staff/users/${id}/password`, {}, { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  resetPassword(id: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(`/staff/users/${id}/reset-password`, { password: newPassword });
  }

  getRoles(): Observable<ApiResponse<RoleDto[]>> {
    return this.api.get<ApiResponse<RoleDto[]>>("/staff/roles", { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  createRole(data: { name: string; description?: string }): Observable<ApiResponse<{ id: string }>> {
    return this.api.post<ApiResponse<{ id: string }>>("/staff/roles", data);
  }

  updateRole(id: string, data: { name: string; description?: string }): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`/staff/roles/${id}`, data);
  }

  deleteRole(id: string): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`/staff/roles/${id}`);
  }

  getRolePermissions(roleId: string): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>(`/staff/roles/${roleId}/permissions`, { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`/staff/roles/${roleId}/permissions`, { permissionIds });
  }

  getModules(): Observable<ApiResponse<ModuleDto[]>> {
    return this.api.get<ApiResponse<ModuleDto[]>>("/staff/modules", { headers: new HttpHeaders().set("X-Refresh", "true") });
  }

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
    return this.api.get<ApiResponse<PaginatedResponse<AuditLogDto>>>("/staff/audit-log", { params: httpParams, headers: new HttpHeaders().set("X-Refresh", "true") });
  }
}
