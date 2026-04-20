import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Observable, shareReplay, startWith, BehaviorSubject, switchMap, tap, of } from "rxjs";
import { ApiHttpClient } from "../http/http-client";

export interface SiteSettings {
  websiteName: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  currency: string;
  freeShippingThreshold: number;
  shippingCharge: number;
  facebookPixelId?: string;
  googleTagId?: string;
  sizeGuideImageUrl?: string;
}

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  private api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly SETTINGS_KEY = makeStateKey<SiteSettings>("site_settings_data");

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  // Cache settings to avoid multiple calls, but allow refresh
  private settings$ = this.refreshSubject.pipe(
    switchMap(() => {
      // 1. SSR Check
      const ssrData = this.transferState.get(this.SETTINGS_KEY, null);
      if (ssrData) {
        if (isPlatformBrowser(this.platformId)) {
          this.transferState.remove(this.SETTINGS_KEY);
        }
        return of(ssrData);
      }

      // 2. API Fetch
      return this.api.get<SiteSettings>("/sitesettings").pipe(
        tap(settings => {
          if (isPlatformServer(this.platformId)) {
            this.transferState.set(this.SETTINGS_KEY, settings);
          }
        }),
        startWith({
          websiteName: "Arza Mart",
          currency: "BDT",
          freeShippingThreshold: 5000,
          shippingCharge: 0,
        } as SiteSettings)
      );
    }),
    shareReplay(1)
  );

  getSettings(): Observable<SiteSettings> {
    return this.settings$;
  }

  refreshSettings(): void {
    this.refreshSubject.next();
  }
}
