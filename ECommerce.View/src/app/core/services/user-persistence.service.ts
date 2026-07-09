import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageKeys } from '../constants/storage-keys';

export interface UserDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserPersistenceService {
  private readonly platformId = inject(PLATFORM_ID);

  saveUserDetails(details: UserDetails): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(StorageKeys.USER_DETAILS, JSON.stringify(details));
    }
  }

  getUserDetails(): UserDetails | null {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem(StorageKeys.USER_DETAILS);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  hasSavedDetails(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(StorageKeys.USER_DETAILS) !== null;
    }
    return false;
  }

  clearUserDetails(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(StorageKeys.USER_DETAILS);
    }
  }
}
