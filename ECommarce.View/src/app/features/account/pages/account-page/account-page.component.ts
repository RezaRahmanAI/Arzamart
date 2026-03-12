import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AuthService } from "../../../../core/services/auth.service";
import { User as AuthUser } from "../../../../core/models/entities";
import { OrderService } from "../../../../core/services/order.service";
import { UserService } from "../../../../core/services/user.service";
import {
  Address,
  PaymentMethod,
  UserProfile,
} from "../../../../core/models/user";
import { Order } from "../../../../core/models/order";

@Component({
  selector: "app-account-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./account-page.component.html",
  styleUrl: "./account-page.component.css",
})
export class AccountPageComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly orderService = inject(OrderService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly profileForm = this.formBuilder.nonNullable.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    phone: "",
  });

  readonly addressForm = this.formBuilder.nonNullable.group({
    label: ["", Validators.required],
    recipient: ["", Validators.required],
    phone: ["", Validators.required],
    address: ["", Validators.required],
    apartment: "",
    city: ["", Validators.required],
    region: ["", Validators.required],
    postalCode: ["", Validators.required],
    country: ["United States", Validators.required],
    isDefault: false,
  });

  readonly paymentForm = this.formBuilder.nonNullable.group({
    label: ["", Validators.required],
    cardNumber: ["", [Validators.required, Validators.minLength(12)]],
    expMonth: ["", Validators.required],
    expYear: ["", Validators.required],
    isDefault: false,
  });

  editingAddressId: string | null = null;
  editingPaymentId: string | null = null;

  readonly vm$ = combineLatest([
    this.authService.currentUser,
    this.userService.profiles$,
    this.orderService.orders$,
  ]).pipe(
    map(([user, profiles, orders]) => {
      const profile = user
        ? (profiles.find((item: any) => item.id === user.id) ?? null)
        : null;
      return { user, profile, orders: user ? orders : ([] as Order[]) };
    }),
  );

  constructor() {
    this.vm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ profile }) => {
        if (!profile) {
          return;
        }
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          phone: profile.phone ?? "",
        });
      });
  }

  saveProfile(profile: UserProfile | null): void {
    if (!profile || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { name, email, phone } = this.profileForm.getRawValue();
    this.userService.updateProfile(profile.id, { name, email, phone });

    // Update local auth state for immediate UI feedback
    this.authService.updateCurrentUser({
      fullName: name,
      email,
    });
  }

  startEditAddress(address: Address): void {
    this.editingAddressId = address.id;
    this.addressForm.patchValue(address);
  }

  resetAddressForm(): void {
    this.editingAddressId = null;
    this.addressForm.reset({
      label: "",
      recipient: "",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      region: "",
      postalCode: "",
      country: "United States",
      isDefault: false,
    });
  }

  submitAddress(profile: UserProfile | null): void {
    if (!profile || this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const value = this.addressForm.getRawValue();
    const address: Address = {
      id: this.editingAddressId ?? this.createId("addr"),
      ...value,
    };

    if (this.editingAddressId) {
      this.userService.updateAddress(profile.id, address);
    } else {
      this.userService.addAddress(profile.id, address);
    }

    if (address.isDefault) {
      this.userService.setDefaultAddress(profile.id, address.id);
    }

    this.resetAddressForm();
  }

  removeAddress(profile: UserProfile | null, addressId: string): void {
    if (!profile) {
      return;
    }
    this.userService.removeAddress(profile.id, addressId);
  }

  setDefaultAddress(profile: UserProfile | null, addressId: string): void {
    if (!profile) {
      return;
    }
    this.userService.setDefaultAddress(profile.id, addressId);
  }

  startEditPayment(method: PaymentMethod): void {
    this.editingPaymentId = method.id;
    this.paymentForm.patchValue({
      label: method.label,
      cardNumber: method.last4,
      expMonth: method.expMonth,
      expYear: method.expYear,
      isDefault: method.isDefault ?? false,
    });
  }

  resetPaymentForm(): void {
    this.editingPaymentId = null;
    this.paymentForm.reset({
      label: "",
      cardNumber: "",
      expMonth: "",
      expYear: "",
      isDefault: false,
    });
  }

  submitPayment(profile: UserProfile | null): void {
    if (!profile || this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const { label, cardNumber, expMonth, expYear, isDefault } =
      this.paymentForm.getRawValue();
    const last4 = cardNumber.slice(-4);
    const method: PaymentMethod = {
      id: this.editingPaymentId ?? this.createId("pm"),
      label,
      brand: this.resolveCardBrand(cardNumber),
      last4,
      expMonth,
      expYear,
      isDefault,
    };

    if (this.editingPaymentId) {
      this.userService.updatePaymentMethod(profile.id, method);
    } else {
      this.userService.addPaymentMethod(profile.id, method);
    }

    if (isDefault) {
      this.userService.setDefaultPaymentMethod(profile.id, method.id);
    }

    this.resetPaymentForm();
  }

  removePayment(profile: UserProfile | null, methodId: string): void {
    if (!profile) {
      return;
    }
    this.userService.removePaymentMethod(profile.id, methodId);
  }

  setDefaultPayment(profile: UserProfile | null, methodId: string): void {
    if (!profile) {
      return;
    }
    this.userService.setDefaultPaymentMethod(profile.id, methodId);
  }

  trackOrder(_: number, order: Order): number {
    return order.id;
  }

  private resolveCardBrand(cardNumber: string): string {
    if (cardNumber.startsWith("4")) {
      return "Visa";
    }
    if (cardNumber.startsWith("5")) {
      return "Mastercard";
    }
    if (cardNumber.startsWith("3")) {
      return "Amex";
    }
    return "Card";
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
