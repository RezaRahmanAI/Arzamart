import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AdminPagesService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/pages";

  getAll(): Observable<StaticPage[]> {
    return this.api.get<StaticPage[]>(this.baseUrl);
  }

  getById(id: number): Observable<StaticPage> {
    return this.api.get<StaticPage>(`${this.baseUrl}/${id}`);
  }

  create(page: Partial<StaticPage>): Observable<StaticPage> {
    return this.api.post<StaticPage>(this.baseUrl, page);
  }

  update(id: number, page: Partial<StaticPage>): Observable<StaticPage> {
    return this.api.post<StaticPage>(`${this.baseUrl}/${id}`, page);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
