import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, startWith } from "rxjs";
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
}

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  private api = inject(ApiHttpClient);

  // Cache settings to avoid multiple calls
  private settings$ = this.api.get<SiteSettings>("/sitesettings").pipe(
    startWith({
      websiteName: "ArzaMart",
      currency: "BDT",
      freeShippingThreshold: 5000,
      shippingCharge: 0,
    } as SiteSettings),
    shareReplay(1),
  );

  getSettings(): Observable<SiteSettings> {
    return this.settings$;
  }
}
