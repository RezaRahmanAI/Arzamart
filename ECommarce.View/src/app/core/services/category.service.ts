import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map } from "rxjs";
import { Category, SubCategory, Collection, CategoryNode, ReorderPayload } from "../models/category";
import { ApiHttpClient } from "../http/http-client";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private readonly api = inject(ApiHttpClient);

  readonly categories$ = this.api.get<Category[]>("/categories").pipe(
    shareReplay(1)
  );

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.categories$.pipe(
      map(cats => cats.find(c => c.slug === slug))
    );
  }

  // Admin methods
  getAllAdmin(): Observable<Category[]> {
    return this.api.get<Category[]>("/admin/categories");
  }

  getById(id: number): Observable<Category> {
    return this.api.get<Category>(`/admin/categories/${id}`);
  }

  create(payload: any): Observable<Category> {
    return this.api.post<Category>("/admin/categories", payload);
  }

  update(id: number, payload: any): Observable<Category> {
    return this.api.post<Category>(`/admin/categories/${id}`, payload);
  }

  delete(id: number): Observable<boolean> {
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

  getSubCategories(): Observable<SubCategory[]> {
    return this.api.get<SubCategory[]>("/admin/sub-categories");
  }

  getSubCategoryById(id: number): Observable<SubCategory> {
    return this.api.get<SubCategory>(`/admin/sub-categories/${id}`);
  }

  createSubCategory(payload: any): Observable<SubCategory> {
    return this.api.post<SubCategory>("/admin/sub-categories", payload);
  }

  updateSubCategory(id: number, payload: any): Observable<SubCategory> {
    return this.api.post<SubCategory>(`/admin/sub-categories/${id}`, payload);
  }

  deleteSubCategory(id: number): Observable<boolean> {
    return this.api.delete<boolean>(`/admin/sub-categories/${id}`);
  }

  uploadSubCategoryImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append("file", file);
    return this.api
      .post<{ url: string }>("/admin/sub-categories/upload-image", formData)
      .pipe(map((response) => response.url));
  }

  getCollections(): Observable<Collection[]> {
    return this.api.get<Collection[]>("/admin/collections");
  }

  getCollectionById(id: number): Observable<Collection> {
    return this.api.get<Collection>(`/admin/collections/${id}`);
  }

  createCollection(payload: any): Observable<Collection> {
    return this.api.post<Collection>("/admin/collections", payload);
  }

  updateCollection(id: number, payload: any): Observable<Collection> {
    return this.api.post<Collection>(`/admin/collections/${id}`, payload);
  }

  deleteCollection(id: number): Observable<boolean> {
    return this.api.delete<boolean>(`/admin/collections/${id}`);
  }
}