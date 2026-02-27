import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
  displayOrder?: number;
}

@Injectable({
  providedIn: "root",
})
export class SubCategoriesService {
  private readonly api = inject(ApiHttpClient);

  getAll(): Observable<SubCategory[]> {
    return this.api.get<SubCategory[]>("/admin/subcategories");
  }

  getById(id: number): Observable<SubCategory> {
    return this.api.get<SubCategory>(`/admin/subcategories/${id}`);
  }

  create(payload: Partial<SubCategory>): Observable<SubCategory> {
    return this.api.post<SubCategory>("/admin/subcategories", payload);
  }

  update(id: number, payload: Partial<SubCategory>): Observable<SubCategory> {
    return this.api.post<SubCategory>(`/admin/subcategories/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/subcategories/${id}`);
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append("file", file);
    return this.api
      .post<{ url: string }>("/admin/subcategories/upload-image", formData)
      .pipe(map((response) => response.url));
  }
}
