import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { LucideAngularModule, User, Mail, Lock, Phone, Save, Shield, Key } from "lucide-angular";
import { ProfileService, UserProfile, UpdateProfileRequest } from "../../services/profile.service";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-admin-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-profile.component.html",
})
export class AdminProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);

  readonly icons = { User, Mail, Lock, Phone, Save, Shield, Key };

  isLoading = true;
  isSubmitting = false;
  isPasswordSubmitting = false;
  userProfile?: UserProfile;

  profileForm = this.fb.group({
    fullName: ["", [Validators.required]],
    userName: ["", [Validators.required]],
    email: ["", [Validators.email]],
    phone: [""],
    currentPassword: [""] // Used for SuperAdmin email change
  });

  passwordForm = this.fb.group({
    currentPassword: ["", [Validators.required]],
    newPassword: ["", [Validators.required, Validators.minLength(6)]],
    confirmPassword: ["", [Validators.required]]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.patchValue({
          fullName: profile.fullName,
          userName: profile.userName,
          email: profile.email,
          phone: profile.phone
        });
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) return;

    const isSuperAdmin = this.authService.isSuperAdmin();
    const emailChanged = this.profileForm.get('email')?.value !== this.userProfile?.email;

    if (isSuperAdmin && emailChanged && !this.profileForm.get('currentPassword')?.value) {
      window.alert("Please provide your current password to change your SuperAdmin email address.");
      return;
    }

    this.isSubmitting = true;
    const updateData: UpdateProfileRequest = {
      fullName: this.profileForm.value.fullName ?? undefined,
      userName: this.profileForm.value.userName ?? undefined,
      email: this.profileForm.value.email ?? undefined,
      phone: this.profileForm.value.phone ?? undefined,
      currentPassword: this.profileForm.value.currentPassword ?? undefined
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        window.alert(res.message || "Profile updated successfully!");
        this.loadProfile();
        // Update local session if needed
        this.authService.updateCurrentUser({
            fullName: this.profileForm.get('fullName')?.value || undefined,
            email: this.profileForm.get('email')?.value || undefined
        });
        this.profileForm.get('currentPassword')?.reset();
      },
      error: (err) => {
        this.isSubmitting = false;
        window.alert(err.error?.message || "Failed to update profile");
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      window.alert("Passwords do not match!");
      return;
    }

    this.isPasswordSubmitting = true;
    this.profileService.changePassword({
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword: this.passwordForm.value.newPassword!
    }).subscribe({
      next: (res) => {
        this.isPasswordSubmitting = false;
        window.alert(res.message || "Password changed successfully!");
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isPasswordSubmitting = false;
        window.alert(err.error?.message || "Failed to change password");
      }
    });
  }
}
