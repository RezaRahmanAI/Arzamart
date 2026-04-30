import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface CustomLandingPageConfig {
  id?: number;
  productId: number;
  relativeTimerTotalMinutes?: number | null;
  isTimerVisible: boolean;
  headerTitle?: string;
  isProductDetailsVisible: boolean;
  productDetailsTitle?: string;
  isFabricVisible: boolean;
  isDesignVisible: boolean;
  isTrustBannerVisible: boolean;
  trustBannerText?: string;
  featuredProductName?: string;
  promoPrice?: number;
  originalPrice?: number;
  isMarqueeVisible: boolean;
  marqueeText?: string;
  promoText?: string;
}

@Injectable({
  providedIn: "root",
})
export class CustomLandingPageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/custom-landing-page`;

  getConfig(productId: number): Observable<CustomLandingPageConfig> {
    return this.http.get<CustomLandingPageConfig>(`${this.apiUrl}/${productId}`);
  }

  saveConfig(config: CustomLandingPageConfig): Observable<CustomLandingPageConfig> {
    return this.http.post<CustomLandingPageConfig>(this.apiUrl, config);
  }
}
