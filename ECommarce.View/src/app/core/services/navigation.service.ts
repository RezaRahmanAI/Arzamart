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
  private readonly baseUrl = "/navigation";

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);
  
  // Data stream that re-triggers on refreshSubject.next()
  readonly megaMenu$ = this.refreshSubject.pipe(
    switchMap(() => this.api.get<any>(`${this.baseUrl}/mega-menu`).pipe(
      map((response) => response?.categories || response?.Categories || []),
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
