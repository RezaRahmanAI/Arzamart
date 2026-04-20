import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, shareReplay, map, of } from "rxjs";
import { Category } from "../models/category";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/categories`;

  // Dynamic stream from API
  readonly categories$ = this.http.get<Category[]>(this.baseUrl).pipe(
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
}
