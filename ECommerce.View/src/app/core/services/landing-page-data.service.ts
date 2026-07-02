import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Observable, of, timeout } from "rxjs";
import { tap } from "rxjs/operators";
import { ApiHttpClient } from "../http/http-client";
import { LandingPageData } from "../models/landing-page";

@Injectable({ providedIn: "root" })
export class LandingPageDataService {
  private readonly api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);

  getBySlug(slug: string): Observable<LandingPageData> {
    const KEY = makeStateKey<LandingPageData>(`clp_data_${slug}`);

    const cached = this.transferState.get(KEY, null);
    if (cached) {
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.transferState.remove(KEY), 1000);
      }
      return of(cached);
    }

    return this.api.get<LandingPageData>(`/custom-landing-page/${slug}`).pipe(
      timeout(15_000),
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(KEY, data);
        }
      })
    );
  }
}
