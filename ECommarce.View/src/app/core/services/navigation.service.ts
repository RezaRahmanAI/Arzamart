import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map, catchError, of, switchMap, BehaviorSubject } from "rxjs";
import { ApiHttpClient } from "../http/http-client";

// Interfaces...
export interface MegaMenuItem {
  id: number;
  name: string;
  slug: string;
  subCategories: MegaMenuSubCategory[];
  isOpen?: boolean; // For mobile toggle
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
  private readonly baseUrl = "/categories"; // Using categories endpoint for mega menu data

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);
  
  // Dynamic stream from API
  readonly megaMenu$ = this.refreshSubject.pipe(
    switchMap(() => this.api.get<any[]>(this.baseUrl).pipe(
      map((response) => response || []),
      catchError((err) => {
        console.error("Mega menu failed to load:", err);
        return of([]);
      })
    )),
    shareReplay(1)
  );

  getMegaMenu(): Observable<MegaMenuItem[]> {
    return this.megaMenu$;
  }

  refreshMegaMenu(): void {
    this.refreshSubject.next();
  }
}
