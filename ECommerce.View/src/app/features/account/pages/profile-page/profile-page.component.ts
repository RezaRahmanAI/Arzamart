import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, ChangeDetectorRef } from "@angular/core";
import { NgIf, AsyncPipe, DatePipe, NgFor } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CustomerProfileService } from "../../../../core/services/customer-profile.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { Order } from "../../../../core/models/order";
import { catchError, finalize, of, Subject, switchMap, takeUntil, tap } from "rxjs";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { AuthService } from "../../../../core/services/auth.service";

@Component({
  selector: "app-profile-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, AsyncPipe, DatePipe, ReactiveFormsModule, AppIconComponent, RouterModule, NgFor],
  templateUrl: "./profile-page.component.html",
  styleUrl: "./profile-page.component.css",
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly profileService = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  readonly imageUrlService = inject(ImageUrlService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  phone$ = this.profileService.phone$;
  isLoggedIn$ = this.authService.isLoggedIn$;
  orders: Order[] = [];
  isLoading = false;
  isSubmitting = false;
  saveSuccess = false;

  loginForm: FormGroup;
  profileForm: FormGroup;

  get totalSpent(): number {
    return this.orders.reduce((sum, order) => sum + order.total, 0);
  }

  constructor() {
    this.loginForm = this.fb.group({
      phone: [
        "",
        [Validators.required, Validators.pattern(/^(?:\+88|01)?\d{11}$/)],
      ],
    });

    this.profileForm = this.fb.group({
      name: ["", Validators.required],
      phone: [{ value: "", disabled: true }], // Phone is read-only in profile
      address: ["", Validators.required],
    });
  }

  ngOnInit(): void {
    this.profileService.phone$.pipe(takeUntil(this.destroy$)).subscribe((phone) => {
      if (phone && this.authService.isLoggedIn()) {
        this.loadData(phone);
      } else {
        this.orders = [];
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const phone = this.loginForm.get("phone")?.value;

    this.authService.customerPhoneLogin(phone).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        if (user) {
          this.profileService.storePhone(phone);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.loginForm.get("phone")?.setErrors({ invalidPhone: true });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        console.error(err);
        this.loginForm.get("phone")?.setErrors({ serverError: true });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.profileService.clearPhone();
    this.orders = [];
    this.loginForm.reset();
    this.cdr.markForCheck();
    this.router.navigate(['/']);
  }

  loadData(phone: string): void {
    this.isLoading = true;

    this.profileService
      .getProfile(phone)
      .pipe(
        tap((profile) => {
          if (profile) {
            this.profileForm.patchValue({
              name: profile.name,
              phone: profile.phone,
              address: profile.address,
            });
          }
        }),
        catchError((err) => {
          if (err.status === 404) {
            this.profileForm.patchValue({ phone });
            this.cdr.markForCheck();
            return of(null);
          }
          return of(null);
        }),
        switchMap(() => this.profileService.getOrders(phone)),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((orders) => {
        this.orders = orders || [];
        this.cdr.markForCheck();
      });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSubmitting = true;
    this.saveSuccess = false;

    const phone = this.profileService.getStoredPhone();
    if (!phone) return;

    const request = {
      ...this.profileForm.getRawValue(),
      phone: phone,
    };

    this.profileService
      .updateProfile(request)
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.saveSuccess = true;
          this.cdr.markForCheck();
          this.successTimeout = setTimeout(() => {
            this.saveSuccess = false;
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          console.error("Failed to update profile", err);
        },
      });
  }
}
