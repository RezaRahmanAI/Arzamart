import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { SocialMediaSource, SocialMediaSourceCreate, SourcePage, SourcePageCreate } from "../models/order-source";
import { ApiHttpClient } from "../http/http-client";

@Injectable({
  providedIn: "root",
})
export class SourceManagementService {
  private readonly api = inject(ApiHttpClient);

  getAllSourcePages(): Observable<SourcePage[]> {
    return this.api.get<SourcePage[]>("/admin/source-pages");
  }

  getActiveSourcePages(): Observable<SourcePage[]> {
    return this.api.get<SourcePage[]>("/admin/source-pages/active");
  }

  createSourcePage(data: SourcePageCreate): Observable<SourcePage> {
    return this.api.post<SourcePage>("/admin/source-pages", data);
  }

  updateSourcePage(id: number, data: SourcePageCreate): Observable<SourcePage> {
    return this.api.put<SourcePage>(`/admin/source-pages/${id}`, data);
  }

  deleteSourcePage(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/source-pages/${id}`);
  }

  getAllSocialMediaSources(): Observable<SocialMediaSource[]> {
    return this.api.get<SocialMediaSource[]>("/admin/social-media-sources");
  }

  getActiveSocialMediaSources(): Observable<SocialMediaSource[]> {
    return this.api.get<SocialMediaSource[]>("/admin/social-media-sources/active");
  }

  createSocialMediaSource(data: SocialMediaSourceCreate): Observable<SocialMediaSource> {
    return this.api.post<SocialMediaSource>("/admin/social-media-sources", data);
  }

  updateSocialMediaSource(id: number, data: SocialMediaSourceCreate): Observable<SocialMediaSource> {
    return this.api.put<SocialMediaSource>(`/admin/social-media-sources/${id}`, data);
  }

  deleteSocialMediaSource(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/social-media-sources/${id}`);
  }
}
