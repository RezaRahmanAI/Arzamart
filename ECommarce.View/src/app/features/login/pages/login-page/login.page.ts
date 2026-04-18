import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { finalize, take } from "rxjs";

import { AuthService } from "../../../../core/services/auth.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
  ],
  templateUrl: "./login.page.html",
})
export class LoginPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    emailOrUsername: ["", [Validators.required]],
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
        emailOrUsername: savedEmail,
        rememberMe: true,
      });
    }
  }

  get emailOrUsername() {
    return this.loginForm.controls.emailOrUsername;
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

    const { emailOrUsername, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .adminLogin(emailOrUsername, password)
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          if (rememberMe) {
            this.authService.saveEmail(emailOrUsername);
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
