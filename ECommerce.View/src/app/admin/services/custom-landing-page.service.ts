import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { CustomLandingPageConfig, LandingPageData } from "../../core/models/landing-page";

export { CustomLandingPageConfig, LandingPageData } from "../../core/models/landing-page";

@Injectable({
  providedIn: "root",
})
export class CustomLandingPageService {
  private readonly api = inject(ApiHttpClient);

  getBySlug(slug: string): Observable<LandingPageData> {
    return this.api.get<LandingPageData>(`/custom-landing-page/${slug}`);
  }

  getConfig(productId: number): Observable<CustomLandingPageConfig> {
    return this.api.get<CustomLandingPageConfig>(`/admin/custom-landing-page/${productId}`);
  }

  saveConfig(config: CustomLandingPageConfig): Observable<CustomLandingPageConfig> {
    return this.api.put<CustomLandingPageConfig>("/admin/custom-landing-page", config);
  }
}
