import { Injectable } from "@angular/core";
import { HttpContextToken } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);
export const SHOW_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  setLoading(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }
}
