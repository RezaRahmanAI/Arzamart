import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map, tap } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { CacheService } from "../cache/cache.service";

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
  faviconUrl?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  websiteName: "Arza Mart",
  currency: "BDT",
  freeShippingThreshold: 5000,
  shippingCharge: 0,
};

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  private api = inject(ApiHttpClient);
  private cache = inject(CacheService);

  getSettings(): Observable<SiteSettings> {
    return this.cache.getOrFetch<SiteSettings>('siteSettings', 'settings',
      (ifNoneMatch) => this.api.getWithHeaders<SiteSettings>("/sitesettings", { ifNoneMatch })
    ).pipe(
      map(result => result.data || DEFAULT_SETTINGS),
      shareReplay(1)
    );
  }

  refreshSettings(): void {
    this.cache.remove('siteSettings', 'settings');
  }
}
