import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AdminUsersService, AdminUser, CreateAdminRequest } from "../../services/admin-users.service";
import { AuthService } from "../../../core/services/auth.service";
import { User as AuthUser } from "../../../core/models/entities";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-user-management",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: "./admin-user-management.component.html",
})
export class AdminUserManagementComponent implements OnInit {
  private usersService = inject(AdminUsersService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  admins: AdminUser[] = [];
  isLoading = false;
  isCreateModalOpen = false;
  isSubmitting = false;
  isCreatePasswordVisible = false;
  isEditPasswordVisible = false;
  
  createForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required]],
    email: ["", [Validators.email]], // Optional
    userName: ["", [Validators.required]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    role: ["Admin" as "Admin" | "SuperAdmin", [Validators.required]]
  });

  isEditModalOpen = false;
  editingAdmin: AdminUser | null = null;
  editForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required]],
    email: ["", [Validators.email]],
    userName: ["", [Validators.required]],
    password: ["", [Validators.minLength(6)]],
    role: ["Admin" as "Admin" | "SuperAdmin", [Validators.required]]
  });

  currentUserRole = "";

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: AuthUser | null) => {
        this.currentUserRole = user?.role || "";
    });
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.usersService.getAdmins().subscribe({
      next: (data) => {
        this.admins = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleStatus(admin: AdminUser): void {
    if (admin.role === 'SuperAdmin' && this.currentUserRole !== 'SuperAdmin') {
        this.notification.warn("Only a SuperAdmin can toggle another SuperAdmin's status.");
        return;
    }

    this.usersService.toggleActive(admin.id).subscribe({
      next: () => {
        admin.isActive = !admin.isActive;
      },
      error: () => this.notification.error("Failed to update status")
    });
  }

  onSubmit(): void {
    if (this.createForm.invalid) return;
    
    this.isSubmitting = true;
    const request = this.createForm.getRawValue();
    
    this.usersService.createAdmin(request as CreateAdminRequest).subscribe({
      next: (response: any) => {
        const newAdmin = response.user;
        this.admins.unshift(newAdmin);
        this.isSubmitting = false;
        this.isCreateModalOpen = false;
        this.createForm.reset({ role: 'Admin' });
        this.notification.success("Admin user created successfully!");
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.error(err.error?.message || "Failed to create admin user");
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
        this.usersService.resetPassword(admin.id, newPassword).subscribe({
            next: () => this.notification.success("Password reset successfully!"),
            error: (err) => this.notification.error(err.error?.message || "Failed to reset password")
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
    this.isEditModalOpen = true;
  }

  onUpdate(): void {
    if (this.editForm.invalid || !this.editingAdmin) return;
    
    this.isSubmitting = true;
    const data = this.editForm.getRawValue();
    
    this.usersService.updateAdmin(this.editingAdmin.id, data).subscribe({
        next: () => {
            if (this.editingAdmin) {
                this.editingAdmin.fullName = data.fullName;
                this.editingAdmin.userName = data.userName;
                this.editingAdmin.email = data.email || "";
                this.editingAdmin.role = data.role;
            }
            this.isSubmitting = false;
            this.isEditModalOpen = false;
            this.notification.success("Staff member updated successfully!");
        },
        error: (err) => {
            this.isSubmitting = false;
            this.notification.error(err.error?.message || "Failed to update staff member");
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
}
