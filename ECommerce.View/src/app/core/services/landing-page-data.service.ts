import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { LandingPageData } from "../models/landing-page";

@Injectable({ providedIn: "root" })
export class LandingPageDataService {
  private readonly api = inject(ApiHttpClient);

  getBySlug(slug: string): Observable<LandingPageData> {
    return this.api.get<LandingPageData>(`/custom-landing-page/${slug}`);
  }
}
