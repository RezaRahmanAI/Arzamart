import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map } from "rxjs";
import { Category } from "../models/category";
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
}
