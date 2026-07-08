import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OfflineIndicatorService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly onlineSubject: BehaviorSubject<boolean>;

  constructor() {
    this.onlineSubject = new BehaviorSubject<boolean>(this.checkOnline());
    if (isPlatformBrowser(this.platformId)) {
      merge(
        fromEvent(window, 'online').pipe(map(() => true)),
        fromEvent(window, 'offline').pipe(map(() => false))
      ).subscribe(this.onlineSubject);
    }
  }

  private checkOnline(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    return navigator.onLine;
  }

  get isOnline$(): Observable<boolean> {
    return this.onlineSubject.pipe(startWith(this.checkOnline()));
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }
}
