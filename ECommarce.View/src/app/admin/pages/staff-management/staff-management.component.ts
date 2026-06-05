import { NgIf, NgClass, DatePipe, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { StaffService, StaffUserDto, RoleDto } from "../../services/staff.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-staff-management",
  standalone: true,
  imports: [NgIf, NgClass, DatePipe, FormsModule, ReactiveFormsModule, AppIconComponent, NgFor],
  templateUrl: "./staff-management.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private staffService = inject(StaffService);
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  staffUsers: StaffUserDto[] = [];
  roles: RoleDto[] = [];
  
  // Filtering & Pagination
  searchQuery = "";
  selectedRoleId = "";
  selectedStatus = ""; // "", "active", "inactive"
  page = 1;
  pageSize = 20;
  totalCount = 0;

  isLoading = false;
  isSubmitting = false;

  // Modals
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isViewPasswordModalOpen = false;
  isResetPasswordModalOpen = false;

  // Password View / Reset
  selectedUser: StaffUserDto | null = null;
  decryptedPassword = "";
  isDecrypting = false;
  isResetting = false;

  isCreatePasswordVisible = false;
  isEditPasswordVisible = false;

  createForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.maxLength(150)]],
    email: ["", [Validators.required, Validators.email, Validators.maxLength(200)]],
    username: ["", [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    roleId: ["", [Validators.required]],
    isActive: [true],
    forceChangePassword: [false]
  });

  editingUser: StaffUserDto | null = null;
  editForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.maxLength(150)]],
    email: ["", [Validators.required, Validators.email, Validators.maxLength(200)]],
    username: ["", [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
    roleId: ["", [Validators.required]],
    isActive: [true],
    forceChangePassword: [false]
  });

  resetForm = this.fb.nonNullable.group({
    password: ["", [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadStaff();
  }

  loadRoles(): void {
    console.log("[StaffManagementComponent] Calling getRoles()...");
    this.staffService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log("[StaffManagementComponent] Loaded roles successfully:", res);
        this.roles = res.data || [];
        console.log("[StaffManagementComponent] Populated roles list:", this.roles);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("[StaffManagementComponent] Failed to load roles", err);
        this.notification.error("Failed to retrieve user roles.");
        this.cdr.detectChanges();
      }
    });
  }

  loadStaff(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const isActiveParam = this.selectedStatus === "active" ? true : (this.selectedStatus === "inactive" ? false : undefined);
    const roleIdParam = this.selectedRoleId ? this.selectedRoleId : undefined;

    const requestParams = {
      search: this.searchQuery || undefined,
      roleId: roleIdParam,
      isActive: isActiveParam,
      page: this.page,
      pageSize: this.pageSize
    };
    console.log("[StaffManagementComponent] Calling getStaffUsers() with params:", requestParams);

    this.staffService.getStaffUsers(requestParams).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log("[StaffManagementComponent] Loaded staff users successfully:", res);
        this.staffUsers = res.data.items || [];
        this.totalCount = res.data.totalCount || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("[StaffManagementComponent] Failed to load staff", err);
        this.isLoading = false;
        this.notification.error("Failed to retrieve staff users.");
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadStaff();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadStaff();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadStaff();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  toggleStatus(user: StaffUserDto): void {
    const currentUserId = this.authService.currentUserSnapshot()?.id;
    if (user.id === currentUserId) {
      this.notification.error("You cannot deactivate your own account.");
      return;
    }

    const newStatus = !user.isActive;
    this.staffService.toggleStatus(user.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        user.isActive = newStatus;
        this.notification.success(`Account ${newStatus ? 'activated' : 'deactivated'} successfully.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notification.error(err.error?.message || "Failed to update status.");
      }
    });
  }

  openCreateModal(): void {
    this.createForm.reset({
      isActive: true,
      forceChangePassword: false
    });
    this.isCreatePasswordVisible = false;
    this.isCreateModalOpen = true;
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) return;

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.staffService.createStaff(this.createForm.getRawValue()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isCreateModalOpen = false;
        this.notification.success("Staff account created successfully!");
        this.loadStaff();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.error(err.error?.message || "Failed to create staff.");
        this.cdr.markForCheck();
      }
    });
  }

  openEditModal(user: StaffUserDto): void {
    this.editingUser = user;
    this.editForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      isActive: user.isActive,
      forceChangePassword: user.forceChangePassword || false
    });
    this.isEditModalOpen = true;
  }

  onEditSubmit(): void {
    if (this.editForm.invalid || !this.editingUser) return;

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.staffService.updateStaff(this.editingUser.id, this.editForm.getRawValue()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isEditModalOpen = false;
        this.notification.success("Staff account updated successfully!");
        this.loadStaff();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.error(err.error?.message || "Failed to update staff.");
        this.cdr.markForCheck();
      }
    });
  }

  deleteUser(user: StaffUserDto): void {
    const currentUserId = this.authService.currentUserSnapshot()?.id;
    if (user.id === currentUserId) {
      this.notification.error("You cannot delete your own account.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete staff account "${user.fullName}"? This will set their deleted status and they will no longer be able to log in.`)) {
      this.staffService.deleteStaff(user.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.notification.success("Staff account soft-deleted successfully.");
          this.loadStaff();
        },
        error: (err) => {
          this.notification.error(err.error?.message || "Failed to delete account.");
        }
      });
    }
  }

  openViewPasswordModal(user: StaffUserDto): void {
    this.selectedUser = user;
    this.decryptedPassword = "";
    this.isViewPasswordModalOpen = true;
  }

  confirmDecryptPassword(): void {
    if (!this.selectedUser) return;

    this.isDecrypting = true;
    this.cdr.markForCheck();

    this.staffService.viewPassword(this.selectedUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.decryptedPassword = res.data.password;
        this.isDecrypting = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDecrypting = false;
        this.notification.error(err.error?.message || "Failed to decrypt password.");
        this.isViewPasswordModalOpen = false;
        this.cdr.markForCheck();
      }
    });
  }

  openResetPasswordModal(user: StaffUserDto): void {
    this.selectedUser = user;
    this.resetForm.reset();
    this.isResetPasswordModalOpen = true;
  }

  generatePassword(): void {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.resetForm.patchValue({ password: generated });
  }

  onResetPasswordSubmit(): void {
    if (this.resetForm.invalid || !this.selectedUser) return;

    this.isResetting = true;
    this.cdr.markForCheck();

    const newPassword = this.resetForm.getRawValue().password;

    this.staffService.resetPassword(this.selectedUser.id, newPassword).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isResetting = false;
        this.isResetPasswordModalOpen = false;
        this.notification.success(`Password reset successfully for ${this.selectedUser?.fullName}.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isResetting = false;
        this.notification.error(err.error?.message || "Failed to reset password.");
        this.cdr.markForCheck();
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return "";
    return name
      .split(" ")
      .filter(n => n.length > 0)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
