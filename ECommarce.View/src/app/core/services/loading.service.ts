import { Injectable } from "@angular/core";
import { HttpContextToken } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);
export const SHOW_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private activeRequests = 0;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.loadingSubject.next(false);
    }
  }
}
