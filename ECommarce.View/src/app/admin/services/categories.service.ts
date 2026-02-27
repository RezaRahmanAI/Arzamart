import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import {
  Category,
  CategoryNode,
  ReorderPayload,
} from "../models/categories.models";
import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({
  providedIn: "root",
})
export class CategoriesService {
  private readonly api = inject(ApiHttpClient);

  getAll(): Observable<Category[]> {
    return this.api.get<Category[]>("/admin/categories");
  }

  getById(id: string): Observable<Category> {
    return this.api.get<Category>(`/admin/categories/${id}`);
  }

  create(payload: Partial<Category>): Observable<Category> {
    return this.api.post<Category>("/admin/categories", payload);
  }

  update(id: string, payload: Partial<Category>): Observable<Category> {
    return this.api.post<Category>(`/admin/categories/${id}`, payload);
  }

  delete(id: string): Observable<boolean> {
    return this.api.delete<boolean>(`/admin/categories/${id}`);
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append("file", file);
    return this.api
      .post<{ url: string }>("/admin/categories/upload-image", formData)
      .pipe(map((response) => response.url));
  }

  reorder(payload: ReorderPayload): Observable<boolean> {
    return this.api.post<boolean>("/admin/categories/reorder", payload);
  }

  getTree(): Observable<CategoryNode[]> {
    return this.api.get<CategoryNode[]>("/admin/categories/tree");
  }
}
