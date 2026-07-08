import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map, of, tap } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { CacheService } from "../cache/cache.service";

export interface MegaMenuItem {
  id: number;
  name: string;
  slug: string;
  subCategories: MegaMenuSubCategory[];
  isOpen?: boolean;
}

export interface MegaMenuSubCategory {
  id: number;
  name: string;
  slug: string;
  collections: MegaMenuCollection[];
}

export interface MegaMenuCollection {
  id: number;
  name: string;
  slug: string;
}

@Injectable({
  providedIn: "root",
})
export class NavigationService {
  private readonly api = inject(ApiHttpClient);
  private readonly cache = inject(CacheService);
  private readonly baseUrl = "/categories";

  getMegaMenu(refresh = false): Observable<MegaMenuItem[]> {
    if (refresh) {
      return this.api.get<any[]>(this.baseUrl).pipe(
        tap(data => this.cache.set('navigation', 'main', data)),
        shareReplay(1)
      );
    }
    return this.cache.getOrFetch<MegaMenuItem[]>('navigation', 'main', () =>
      this.api.get<any[]>(this.baseUrl)
    ).pipe(
      map(result => result.data || []),
      shareReplay(1)
    );
  }

  refreshMegaMenu(): void {
    this.cache.remove('navigation', 'main');
  }
}
