import { Injectable, inject } from "@angular/core";
import { Observable, map, timeout } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { LandingPageData } from "../models/landing-page";
import { CacheService } from "../cache/cache.service";

@Injectable({ providedIn: "root" })
export class LandingPageDataService {
  private readonly api = inject(ApiHttpClient);
  private readonly cache = inject(CacheService);

  getBySlug(slug: string): Observable<LandingPageData> {
    return this.cache.getOrFetch<LandingPageData>('landingPages', slug, () =>
      this.api.get<LandingPageData>(`/custom-landing-page/${slug}`).pipe(
        timeout(15_000)
      )
    ).pipe(
      map(result => result.data)
    );
  }
}
