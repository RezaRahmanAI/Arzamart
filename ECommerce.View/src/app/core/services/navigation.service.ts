import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map, tap } from "rxjs";
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
  private readonly baseUrl = "/navigation/mega-menu";

  getMegaMenu(refresh = false): Observable<MegaMenuItem[]> {
    if (refresh) {
      return this.api.getWithHeaders<any>(this.baseUrl).pipe(
        tap(result => {
          if (result.data) {
            this.cache.set('navigation', 'main', result.data, result.etag ?? undefined, result.cacheVersion ?? undefined);
          }
        }),
        map(result => result.data?.categories || []),
        shareReplay(1)
      );
    }
    return this.cache.getOrFetch<any>('navigation', 'main',
      (ifNoneMatch) => this.api.getWithHeaders<any>(this.baseUrl, { ifNoneMatch })
    ).pipe(
      map(result => result.data?.categories || []),
      shareReplay(1)
    );
  }

  refreshMegaMenu(): void {
    this.cache.remove('navigation', 'main');
  }
}
