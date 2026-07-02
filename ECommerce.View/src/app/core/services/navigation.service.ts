import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Observable, shareReplay, map, catchError, of, switchMap, BehaviorSubject, tap, startWith } from "rxjs";
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
  private readonly baseUrl = "/categories";
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);

  private readonly MEGA_MENU_KEY = makeStateKey<any[]>("mega_menu_data");

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  readonly megaMenu$ = this.refreshSubject.pipe(
    switchMap(() => {
      const ssrData = this.transferState.get(this.MEGA_MENU_KEY, null);
      if (ssrData) {
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            if (this.transferState.hasKey(this.MEGA_MENU_KEY)) {
              this.transferState.remove(this.MEGA_MENU_KEY);
            }
          }, 1000);
        }
        return of(ssrData);
      }
      return this.api.get<any[]>(this.baseUrl).pipe(
        tap((data) => {
          if (isPlatformServer(this.platformId)) {
            this.transferState.set(this.MEGA_MENU_KEY, data);
          }
        }),
        catchError((err) => {
          console.error("Mega menu failed to load:", err);
          return of([]);
        })
      );
    }),
    startWith([]),
    shareReplay(1)
  );

  getMegaMenu(): Observable<MegaMenuItem[]> {
    return this.megaMenu$;
  }

  refreshMegaMenu(): void {
    this.refreshSubject.next();
  }
}
