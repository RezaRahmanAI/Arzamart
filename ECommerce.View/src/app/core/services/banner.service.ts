import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map, tap } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { CacheService } from "../cache/cache.service";

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  buttonText: string;
  displayOrder: number;
  type: "Hero" | "Promo" | "Spotlight";
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class BannerService {
  private readonly api = inject(ApiHttpClient);
  private readonly cache = inject(CacheService);
  private readonly baseUrl = "/banners";
  private readonly adminBaseUrl = "/admin/banners";

  getActiveBanners(): Observable<Banner[]> {
    return this.cache.getOrFetch<Banner[]>('banners', 'active',
      (ifNoneMatch) => this.api.getWithHeaders<Banner[]>(this.baseUrl, { ifNoneMatch })
    ).pipe(
      map(result => result.data),
      shareReplay(1)
    );
  }

  refresh(): void {
    this.cache.remove('banners', 'active');
  }

  getAllAdmin(): Observable<Banner[]> {
    return this.api.get<Banner[]>(this.adminBaseUrl);
  }

  getById(id: number): Observable<Banner> {
    return this.api.get<Banner>(`${this.adminBaseUrl}/${id}`);
  }

  create(banner: Partial<Banner>): Observable<Banner> {
    return this.api.post<Banner>(this.adminBaseUrl, banner);
  }

  update(id: number, banner: Partial<Banner>): Observable<Banner> {
    return this.api.post<Banner>(`${this.adminBaseUrl}/${id}`, banner);
  }

  delete(id: number): Observable<void> {
    return this.api.post<void>(`${this.adminBaseUrl}/${id}/delete`, {});
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.api.post<{ url: string }>(`${this.adminBaseUrl}/image`, formData);
  }
}
