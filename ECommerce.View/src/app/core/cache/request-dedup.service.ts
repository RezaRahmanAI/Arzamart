import { Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RequestDedupService {
  private readonly inFlight = new Map<string, Observable<any>>();

  getOrMake<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const obs = factory().pipe(
      finalize(() => this.inFlight.delete(key))
    );
    this.inFlight.set(key, obs);
    return obs;
  }

  isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  cancel(key: string): void {
    this.inFlight.delete(key);
  }

  cancelAll(): void {
    this.inFlight.clear();
  }
}
