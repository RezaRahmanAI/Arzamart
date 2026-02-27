import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { finalize, take } from "rxjs";

import { AuthService } from "../../../../core/services/auth.service";

import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-angular";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./login.page.html",
})
export class LoginPageComponent implements OnInit {
  readonly icons = {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
  };
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    rememberMe: false,
  });

  isPasswordVisible = false;
  isLoading = false;
  errorMessage = "";

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      void this.router.navigateByUrl("/admin/dashboard");
      return;
    }

    const savedEmail = this.authService.getSavedEmail();
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true,
      });
    }
  }

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  submit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .adminLogin(email, password) // Removed rememberMe from login call
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          if (rememberMe) {
            this.authService.saveEmail(email);
          } else {
            this.authService.clearSavedEmail();
          }
          void this.router.navigateByUrl("/admin/dashboard");
        },
        error: (error: Error) => {
          this.errorMessage = error.message || "Invalid credentials";
        },
      });
  }
}
