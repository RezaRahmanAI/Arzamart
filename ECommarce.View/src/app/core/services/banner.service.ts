import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, BehaviorSubject, switchMap } from "rxjs";
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
  type: "Hero" | "Promo" | "Spotlight";
}

@Injectable({
  providedIn: "root",
})
export class BannerService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/banners";

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  // Cache banners — they refresh when refreshSubject emits
  private banners$ = this.refreshSubject.pipe(
    switchMap(() => this.api.get<HeroBanner[]>(this.baseUrl)),
    shareReplay(1)
  );

  getActiveBanners(): Observable<HeroBanner[]> {
    return this.banners$;
  }

  refresh(): void {
    this.refreshSubject.next();
  }
}
