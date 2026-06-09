import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { SocialMediaSource, SocialMediaSourceCreate, SourcePage, SourcePageCreate } from "../models/order-source";

@Injectable({
  providedIn: "root",
})
export class SourceManagementService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Source Pages
  getAllSourcePages(): Observable<SourcePage[]> {
    return this.http.get<SourcePage[]>(`${this.apiUrl}/admin/source-pages`);
  }

  getActiveSourcePages(): Observable<SourcePage[]> {
    return this.http.get<SourcePage[]>(`${this.apiUrl}/admin/source-pages/active`);
  }

  createSourcePage(data: SourcePageCreate): Observable<SourcePage> {
    return this.http.post<SourcePage>(`${this.apiUrl}/admin/source-pages`, data);
  }

  updateSourcePage(id: number, data: SourcePageCreate): Observable<SourcePage> {
    return this.http.post<SourcePage>(`${this.apiUrl}/admin/source-pages/${id}`, data);
  }

  deleteSourcePage(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/source-pages/${id}/delete`, {});
  }

  // Social Media Sources
  getAllSocialMediaSources(): Observable<SocialMediaSource[]> {
    return this.http.get<SocialMediaSource[]>(`${this.apiUrl}/admin/social-media-sources`);
  }

  getActiveSocialMediaSources(): Observable<SocialMediaSource[]> {
    return this.http.get<SocialMediaSource[]>(`${this.apiUrl}/admin/social-media-sources/active`);
  }

  createSocialMediaSource(data: SocialMediaSourceCreate): Observable<SocialMediaSource> {
    return this.http.post<SocialMediaSource>(`${this.apiUrl}/admin/social-media-sources`, data);
  }

  updateSocialMediaSource(id: number, data: SocialMediaSourceCreate): Observable<SocialMediaSource> {
    return this.http.post<SocialMediaSource>(`${this.apiUrl}/admin/social-media-sources/${id}`, data);
  }

  deleteSocialMediaSource(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/social-media-sources/${id}/delete`, {});
  }
}
