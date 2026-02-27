import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay } from "rxjs";
import { ApiHttpClient } from "../http/http-client";

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  buttonText: string;
  displayOrder: number;
}

@Injectable({
  providedIn: "root",
})
export class BannerService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/banners";

  // Cache banners — they rarely change during a session
  private banners$ = this.api
    .get<HeroBanner[]>(this.baseUrl)
    .pipe(shareReplay(1));

  getActiveBanners(): Observable<HeroBanner[]> {
    return this.banners$;
  }
}
