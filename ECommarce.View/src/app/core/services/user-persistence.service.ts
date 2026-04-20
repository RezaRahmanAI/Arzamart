import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UserDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  area: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserPersistenceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'arza_user_details';

  saveUserDetails(details: UserDetails): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(details));
    }
  }

  getUserDetails(): UserDetails | null {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  hasSavedDetails(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
    return false;
  }

  clearUserDetails(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
