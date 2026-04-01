import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, startWith, BehaviorSubject, switchMap } from "rxjs";
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

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  // Cache settings to avoid multiple calls, but allow refresh
  private settings$ = this.refreshSubject.pipe(
    switchMap(() => this.api.get<SiteSettings>("/sitesettings")),
    startWith({
      websiteName: "Arza Mart",
      currency: "BDT",
      freeShippingThreshold: 5000,
      shippingCharge: 0,
    } as SiteSettings),
    shareReplay(1)
  );

  getSettings(): Observable<SiteSettings> {
    return this.settings$;
  }

  refreshSettings(): void {
    this.refreshSubject.next();
  }
}
