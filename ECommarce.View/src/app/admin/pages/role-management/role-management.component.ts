import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { StaffService, RoleDto, ModuleDto, ModulePermissionDto } from "../../services/staff.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-role-management",
  standalone: true,
  imports: [NgIf, NgClass, NgFor, FormsModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: "./role-management.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private staffService = inject(StaffService);
  private fb = inject(FormBuilder);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  roles: RoleDto[] = [];
  modules: ModuleDto[] = [];
  selectedRole: RoleDto | null = null;
  selectedPermissionIds: Set<string> = new Set<string>();

  isLoading = false;
  isSaving = false;
  isRoleModalOpen = false;
  isSubmitting = false;

  roleForm = this.fb.nonNullable.group({
    id: [""],
    name: ["", [Validators.required, Validators.maxLength(100)]],
    description: [""]
  });

  ngOnInit(): void {
    this.loadRolesAndModules();
  }

  loadRolesAndModules(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.staffService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roleRes) => {
        this.roles = roleRes.data;
        if (this.roles.length > 0 && !this.selectedRole) {
          this.selectRole(this.roles[0]);
        }
        
        this.staffService.getModules().pipe(takeUntil(this.destroy$)).subscribe({
          next: (moduleRes) => {
            this.modules = moduleRes.data;
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.notification.error("Failed to load modules.");
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.notification.error("Failed to load roles.");
        this.cdr.markForCheck();
      }
    });
  }

  selectRole(role: RoleDto): void {
    this.selectedRole = role;
    this.selectedPermissionIds.clear();
    this.cdr.markForCheck();

    this.staffService.getRolePermissions(role.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        res.data.forEach(id => this.selectedPermissionIds.add(id));
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error("Failed to load permissions for role.");
      }
    });
  }

  isPermissionChecked(permissionId: string): boolean {
    return this.selectedPermissionIds.has(permissionId);
  }

  getPermission(module: ModuleDto, action: string): ModulePermissionDto | undefined {
    return module.permissions.find(p => p.action === action);
  }

  togglePermission(permissionId: string): void {
    if (this.selectedPermissionIds.has(permissionId)) {
      this.selectedPermissionIds.delete(permissionId);
    } else {
      this.selectedPermissionIds.add(permissionId);
    }
  }

  savePermissions(): void {
    if (!this.selectedRole) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    const permissionIds = Array.from(this.selectedPermissionIds);
    this.staffService.updateRolePermissions(this.selectedRole.id, permissionIds).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success("Role permissions updated successfully!");
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        this.notification.error(err.error?.message || "Failed to save permissions.");
        this.cdr.markForCheck();
      }
    });
  }

  openCreateModal(): void {
    this.roleForm.reset();
    this.isRoleModalOpen = true;
  }

  openEditModal(role: RoleDto): void {
    this.roleForm.patchValue({
      id: role.id,
      name: role.name,
      description: role.description || ""
    });
    this.isRoleModalOpen = true;
  }

  onSubmitRole(): void {
    if (this.roleForm.invalid) return;

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const data = this.roleForm.getRawValue();

    if (data.id) {
      // Edit
      this.staffService.updateRole(data.id, { name: data.name, description: data.description }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isRoleModalOpen = false;
          this.notification.success("Role updated successfully!");
          this.loadRolesAndModules();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notification.error(err.error?.message || "Failed to update role.");
          this.cdr.markForCheck();
        }
      });
    } else {
      // Create
      this.staffService.createRole({ name: data.name, description: data.description }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isRoleModalOpen = false;
          this.notification.success("Role created successfully!");
          this.loadRolesAndModules();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notification.error(err.error?.message || "Failed to create role.");
          this.cdr.markForCheck();
        }
      });
    }
  }

  deleteRole(role: RoleDto): void {
    if (role.isSystemRole) {
      this.notification.warn("System roles cannot be deleted.");
      return;
    }

    if (role.staffCount > 0) {
      this.notification.error("Cannot delete role because staff members are assigned to it.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete role "${role.name}"? This action cannot be undone.`)) {
      this.staffService.deleteRole(role.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.notification.success("Role deleted successfully.");
          this.selectedRole = null;
          this.loadRolesAndModules();
        },
        error: (err) => {
          this.notification.error(err.error?.message || "Failed to delete role.");
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
