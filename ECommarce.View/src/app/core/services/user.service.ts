import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AuthUser } from './auth.service';
import { Address, PaymentMethod, UserProfile } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly storageKey = 'user_profiles';

  private readonly profilesSubject = new BehaviorSubject<UserProfile[]>(this.loadProfiles());
  readonly profiles$ = this.profilesSubject.asObservable();

  ensureUserProfile(user: AuthUser): void {
    const profiles = this.profilesSubject.getValue();
    const existing = profiles.find((profile) => profile.id === user.id);
    if (existing) {
      return;
    }

    const newProfile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      addresses: [],
      paymentMethods: [],
    };

    this.updateProfiles([...profiles, newProfile]);
  }

  updateProfile(userId: string, partial: Partial<UserProfile>): void {
    const profiles = this.profilesSubject.getValue();
    const next = profiles.map((profile) => (profile.id === userId ? { ...profile, ...partial } : profile));
    this.updateProfiles(next);
  }

  addAddress(userId: string, address: Address): void {
    this.updateProfile(userId, {
      addresses: this.applyDefaultAddress([...(this.getProfile(userId)?.addresses ?? []), address]),
    });
  }

  updateAddress(userId: string, address: Address): void {
    const current = this.getProfile(userId)?.addresses ?? [];
    const updated = current.map((item) => (item.id === address.id ? address : item));
    this.updateProfile(userId, { addresses: this.applyDefaultAddress(updated) });
  }

  removeAddress(userId: string, addressId: string): void {
    const current = this.getProfile(userId)?.addresses ?? [];
    const updated = current.filter((item) => item.id !== addressId);
    this.updateProfile(userId, { addresses: this.applyDefaultAddress(updated) });
  }

  setDefaultAddress(userId: string, addressId: string): void {
    const current = this.getProfile(userId)?.addresses ?? [];
    const updated = current.map((item) => ({ ...item, isDefault: item.id === addressId }));
    this.updateProfile(userId, { addresses: updated });
  }

  addPaymentMethod(userId: string, method: PaymentMethod): void {
    this.updateProfile(userId, {
      paymentMethods: this.applyDefaultPaymentMethod([...(this.getProfile(userId)?.paymentMethods ?? []), method]),
    });
  }

  updatePaymentMethod(userId: string, method: PaymentMethod): void {
    const current = this.getProfile(userId)?.paymentMethods ?? [];
    const updated = current.map((item) => (item.id === method.id ? method : item));
    this.updateProfile(userId, { paymentMethods: this.applyDefaultPaymentMethod(updated) });
  }

  removePaymentMethod(userId: string, methodId: string): void {
    const current = this.getProfile(userId)?.paymentMethods ?? [];
    const updated = current.filter((item) => item.id !== methodId);
    this.updateProfile(userId, { paymentMethods: this.applyDefaultPaymentMethod(updated) });
  }

  setDefaultPaymentMethod(userId: string, methodId: string): void {
    const current = this.getProfile(userId)?.paymentMethods ?? [];
    const updated = current.map((item) => ({ ...item, isDefault: item.id === methodId }));
    this.updateProfile(userId, { paymentMethods: updated });
  }

  getProfile(userId: string): UserProfile | undefined {
    return this.profilesSubject.getValue().find((profile) => profile.id === userId);
  }

  private applyDefaultAddress(addresses: Address[]): Address[] {
    if (!addresses.length) {
      return [];
    }

    if (addresses.some((address) => address.isDefault)) {
      return addresses;
    }

    const [first, ...rest] = addresses;
    return [{ ...first, isDefault: true }, ...rest.map((address) => ({ ...address, isDefault: false }))];
  }

  private applyDefaultPaymentMethod(methods: PaymentMethod[]): PaymentMethod[] {
    if (!methods.length) {
      return [];
    }

    if (methods.some((method) => method.isDefault)) {
      return methods;
    }

    const [first, ...rest] = methods;
    return [{ ...first, isDefault: true }, ...rest.map((method) => ({ ...method, isDefault: false }))];
  }

  private loadProfiles(): UserProfile[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as UserProfile[];
    } catch {
      return [];
    }
  }

  private updateProfiles(profiles: UserProfile[]): void {
    this.profilesSubject.next(profiles);
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
  }
}
