import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { HttpContextToken } from "@angular/common/http";
import { isPlatformBrowser } from "@angular/common";
import { BehaviorSubject, Observable, debounceTime, of, switchMap } from "rxjs";

export const SHOW_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly requestCountSubject = new BehaviorSubject<number>(0);
  readonly loading$: Observable<boolean>;

  constructor() {
    this.loading$ = this.requestCountSubject.pipe(
      debounceTime(isPlatformBrowser(this.platformId) ? 300 : 0),
      switchMap(count => {
        if (count > 0) {
          return new Observable<boolean>(observer => {
            const timeout = setTimeout(() => observer.next(true), 150);
            return () => clearTimeout(timeout);
          });
        }
        return of(false);
      })
    );
  }

  setLoading(isLoading: boolean): void {
    if (isLoading) {
      this.requestCountSubject.next(this.requestCountSubject.value + 1);
    } else {
      const current = this.requestCountSubject.value;
      if (current > 0) {
        this.requestCountSubject.next(current - 1);
      } else {
        this.requestCountSubject.next(0);
      }
    }
  }
}
