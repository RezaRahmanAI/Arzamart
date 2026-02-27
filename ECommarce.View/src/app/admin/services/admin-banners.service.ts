import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  buttonText: string;
  displayOrder: number;
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AdminBannersService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/banners";

  getAll(): Observable<Banner[]> {
    return this.api.get<Banner[]>(this.baseUrl);
  }

  getById(id: number): Observable<Banner> {
    return this.api.get<Banner>(`${this.baseUrl}/${id}`);
  }

  create(banner: Partial<Banner>): Observable<Banner> {
    return this.api.post<Banner>(this.baseUrl, banner);
  }

  update(id: number, banner: Partial<Banner>): Observable<Banner> {
    return this.api.post<Banner>(`${this.baseUrl}/${id}`, banner);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.api.post<{ url: string }>(`${this.baseUrl}/image`, formData);
  }
}
