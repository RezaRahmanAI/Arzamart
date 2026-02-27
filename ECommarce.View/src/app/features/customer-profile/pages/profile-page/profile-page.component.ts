import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CustomerProfileService } from "../../../../core/services/customer-profile.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { Order } from "../../../../core/models/order";
import { catchError, finalize, of, switchMap, tap } from "rxjs";

import {
  LucideAngularModule,
  Package,
  User,
  MapPin,
  LogOut,
  ChevronRight,
  Phone,
  Clock,
  CreditCard,
  CheckCircle2,
} from "lucide-angular";

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./profile-page.component.html",
  styleUrl: "./profile-page.component.css",
})
export class ProfilePageComponent implements OnInit {
  readonly icons = {
    Package,
    User,
    MapPin,
    LogOut,
    ChevronRight,
    Phone,
    Clock,
    CreditCard,
    CheckCircle2,
  };
  private readonly profileService = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);
  readonly imageUrlService = inject(ImageUrlService);

  phone$ = this.profileService.phone$;
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
    this.profileService.phone$.subscribe((phone) => {
      if (phone) {
        this.loadData(phone);
      }
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const phone = this.loginForm.get("phone")?.value;

    // Ideally we verify if customer exists, but here we just set the phone
    // effectively "logging in"
    this.profileService.storePhone(phone);
    this.isSubmitting = false;
  }

  logout(): void {
    this.profileService.clearPhone();
    this.orders = [];
    this.loginForm.reset();
  }

  loadData(phone: string): void {
    this.isLoading = true;

    // Load profile
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
          // If profile not found (new customer), we still allow them to see the page
          // maybe pre-fill phone
          if (err.status === 404) {
            this.profileForm.patchValue({ phone });
            return of(null);
          }
          return of(null);
        }),
        switchMap(() => this.profileService.getOrders(phone)),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((orders) => {
        this.orders = orders || [];
      });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSubmitting = true;
    this.saveSuccess = false;

    // Ensure we send phone, even if disabled in form
    const phone = this.profileService.getStoredPhone();
    if (!phone) return;

    const request = {
      ...this.profileForm.getRawValue(),
      phone: phone,
    };

    this.profileService
      .updateProfile(request)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.saveSuccess = true;
          setTimeout(() => (this.saveSuccess = false), 3000);
        },
        error: (err) => {
          console.error("Failed to update profile", err);
        },
      });
  }
}
