import { NgIf, NgClass, DatePipe, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { UsersService, AdminUser, CreateAdminRequest } from "../../services/users.service";
import { StaffService, RoleDto } from "../../services/staff.service";
import { AuthService } from "../../../core/services/auth.service";
import { User as AuthUser } from "../../../core/models/entities";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-admin-user-management",
  standalone: true,
  imports: [NgIf, NgClass, DatePipe, FormsModule, ReactiveFormsModule, AppIconComponent, NgFor],
  templateUrl: "./user-management.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private usersService = inject(UsersService);
  private staffService = inject(StaffService);
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  roles: RoleDto[] = [];
  rolePermissionsMap: Record<string, string[]> = {};

  admins: AdminUser[] = [];
  isLoading = false;
  isCreateModalOpen = false;
  isSubmitting = false;
  isCreatePasswordVisible = false;
  isEditPasswordVisible = false;
  searchQuery = "";

  isHistoryModalOpen = false;
  selectedUserHistory: any[] = [];
  selectedHistoryUserName = "";
  isHistoryLoading = false;

  createForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required]],
    email: ["", [Validators.pattern(/^[^A-Z]+$/)]],
    userName: ["", [Validators.required, Validators.pattern(/^[a-z0-9]+$/)]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    role: ["Staff", [Validators.required]]
  });

  availableMenus = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Products & Inventory" },
    { key: "orders", label: "Orders Management" },
    { key: "customers", label: "Customers" },
    { key: "analytics", label: "Analytics" },
    { key: "settings", label: "Settings" },
    { key: "banners", label: "Banners" },
    { key: "navigation", label: "Navigation" },
    { key: "pages", label: "Content Pages" },
    { key: "reviews", label: "Reviews" },
    { key: "order-sources", label: "Order Sources" },
    { key: "security", label: "Security" },
    { key: "users", label: "Users" }
  ];

  selectedMenus: string[] = [];
  revealedPasswords: Set<string> = new Set();
  passwordLoading: Set<string> = new Set();

  isEditModalOpen = false;
  editingAdmin: AdminUser | null = null;
  editForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required]],
    email: ["", [Validators.pattern(/^[^A-Z]+$/)]],
    userName: ["", [Validators.required, Validators.pattern(/^[a-z0-9]+$/)]],
    password: [""],
    role: ["Staff", [Validators.required]]
  });

  currentUserRole = "";

  get filteredAdmins(): AdminUser[] {
    if (!this.searchQuery.trim()) return this.admins;
    const q = this.searchQuery.toLowerCase();
    return this.admins.filter(
      a =>
        a.fullName.toLowerCase().includes(q) ||
        a.userName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }

  get totalCount(): number { return this.filteredAdmins.length; }
  get activeCount(): number { return this.filteredAdmins.filter(a => a.isActive).length; }
  get superAdminCount(): number { return this.filteredAdmins.filter(a => a.role === "SuperAdmin").length; }
  get adminCount(): number { return this.filteredAdmins.filter(a => a.role === "Admin").length; }
  get staffCount(): number { return this.filteredAdmins.filter(a => a.role === "Staff").length; }

  get superAdmins(): AdminUser[] { return this.filteredAdmins.filter(a => a.role === "SuperAdmin"); }
  get adminsList(): AdminUser[] { return this.filteredAdmins.filter(a => a.role === "Admin"); }
  get staffList(): AdminUser[] { return this.filteredAdmins.filter(a => a.role === "Staff"); }

  ngOnInit(): void {
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe((user: AuthUser | null) => {
        this.currentUserRole = user?.role || "";
    });
    this.loadAdmins();
    this.loadRoles();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.usersService.getAdmins().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.admins = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadRoles(): void {
    this.staffService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.roles = res;
        this.roles.forEach(role => {
          this.staffService.getRolePermissions(role.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: (permRes) => {
              this.rolePermissionsMap[role.id] = permRes;
              this.cdr.markForCheck();
            }
          });
        });
        this.cdr.markForCheck();
      }
    });
  }

  copyPassword(password: string): void {
    navigator.clipboard.writeText(password).then(() => {
      this.notification.success("Password copied to clipboard");
    }).catch(() => {
      this.notification.error("Failed to copy password");
    });
  }

  togglePasswordVisibility(admin: AdminUser): void {
    if (this.revealedPasswords.has(admin.id)) {
      this.revealedPasswords.delete(admin.id);
      this.cdr.markForCheck();
      return;
    }

    if (admin.plainPassword) {
      this.revealedPasswords.add(admin.id);
      this.cdr.markForCheck();
      return;
    }

    this.passwordLoading.add(admin.id);
    this.cdr.markForCheck();
    this.usersService.getPassword(admin.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.password) {
          admin.plainPassword = res.password;
          this.revealedPasswords.add(admin.id);
        } else {
          this.notification.warn(res.message || "No encrypted password stored. Please reset the password.");
        }
        this.passwordLoading.delete(admin.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.passwordLoading.delete(admin.id);
        this.notification.error("Failed to retrieve password");
        this.cdr.markForCheck();
      }
    });
  }

  toggleStatus(admin: AdminUser): void {
    if (admin.role === 'SuperAdmin' && this.currentUserRole !== 'SuperAdmin') {
        this.notification.warn("Only a SuperAdmin can toggle another SuperAdmin's status.");
        return;
    }

    this.usersService.toggleActive(admin.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        admin.isActive = !admin.isActive;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error("Failed to update status");
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (this.createForm.invalid) return;
    
    this.isSubmitting = true;
    const request = this.createForm.getRawValue();
    const finalRequest: any = { ...request };
    finalRequest.allowedMenus = this.rolePermissionsMap[request.role] || [];
    
    this.usersService.createAdmin(finalRequest as CreateAdminRequest).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const newAdmin = response.user;
        newAdmin.plainPassword = request.password;
        this.admins.unshift(newAdmin);
        this.isSubmitting = false;
        this.isCreateModalOpen = false;
        this.selectedMenus = [];
        this.createForm.reset({ role: 'Staff' });
        this.notification.success("Admin user created successfully!");
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.error(err.error?.message || "Failed to create admin user");
        this.cdr.markForCheck();
      }
    });
  }

  resetPassword(admin: AdminUser): void {
    const newPassword = window.prompt(`Enter new password for ${admin.userName}:`);
    if (!newPassword || newPassword.length < 6) {
        if (newPassword) this.notification.warn("Password must be at least 6 characters.");
        return;
    }

    if (window.confirm(`Are you sure you want to reset the password for ${admin.userName}?`)) {
        this.usersService.resetPassword(admin.id, newPassword).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
              admin.plainPassword = newPassword;
              if (this.revealedPasswords.has(admin.id)) {
                this.revealedPasswords.delete(admin.id);
              }
              this.notification.success("Password reset successfully!");
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.notification.error(err.error?.message || "Failed to reset password");
              this.cdr.markForCheck();
            }
        });
    }
  }

  openEditModal(admin: AdminUser): void {
    this.editingAdmin = admin;
    this.editForm.patchValue({
        fullName: admin.fullName,
        email: admin.email || "",
        userName: admin.userName,
        password: "",
        role: admin.role as any
    });
    this.isEditPasswordVisible = false;
    this.selectedMenus = admin.allowedMenus || [];
    this.isEditModalOpen = true;
  }

  onUpdate(): void {
    if (this.editForm.invalid || !this.editingAdmin) return;
    
    this.isSubmitting = true;
    const data = this.editForm.getRawValue();
    const finalData: any = { ...data };
    finalData.allowedMenus = this.rolePermissionsMap[data.role] || [];
    
    this.usersService.updateAdmin(this.editingAdmin.id, finalData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
            if (this.editingAdmin) {
                this.editingAdmin.fullName = data.fullName;
                this.editingAdmin.userName = data.userName;
                this.editingAdmin.email = data.email || "";
                this.editingAdmin.role = data.role;
                if (data.password) {
                  this.editingAdmin.plainPassword = data.password;
                  this.revealedPasswords.delete(this.editingAdmin.id);
                }
                this.editingAdmin.allowedMenus = [...finalData.allowedMenus];
            }
            this.isSubmitting = false;
            this.isEditModalOpen = false;
            this.notification.success("Staff member updated successfully!");
            this.cdr.markForCheck();
        },
        error: (err) => {
            this.isSubmitting = false;
            this.notification.error(err.error?.message || "Failed to update staff member");
            this.cdr.markForCheck();
        }
    });
  }

  deleteAdmin(admin: AdminUser): void {
    if (admin.role === 'SuperAdmin') {
        this.notification.warn("SuperAdmin accounts cannot be deleted for safety.");
        return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${admin.fullName}? This action cannot be undone.`)) {
        this.notification.warn("Deletion is disabled. Please deactivate the user instead.");
    }
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  openHistoryModal(admin: AdminUser): void {
    this.selectedHistoryUserName = admin.fullName || admin.userName;
    this.selectedUserHistory = [];
    this.isHistoryLoading = true;
    this.isHistoryModalOpen = true;
    this.cdr.markForCheck();

    this.usersService.getActivityLog(admin.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (logs) => {
        this.selectedUserHistory = logs || [];
        this.isHistoryLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error("Failed to load user activity log");
        this.isHistoryLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleMenuSelection(menuKey: string): void {
    const idx = this.selectedMenus.indexOf(menuKey);
    if (idx > -1) {
        this.selectedMenus.splice(idx, 1);
    } else {
        this.selectedMenus.push(menuKey);
    }
  }

  get roleIcons(): Record<string, string> {
    return { SuperAdmin: "ShieldCheck", Admin: "Shield", Staff: "User" };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
