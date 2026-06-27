import { Injectable, inject } from "@angular/core";
import { Observable, catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap } from "rxjs";

import { OrderApiService, CustomerLookupResponse } from "./order-api.service";

@Injectable({ providedIn: "root" })
export class CustomerLookupService {
  private readonly orderApi = inject(OrderApiService);

  /**
   * Returns an operator chain that debounces a phone valueChanges observable,
   * calls the lookup API, and emits CustomerLookupResponse or null.
   *
   * Usage in a component:
   *   this.customerLookup.bindTo(this.form.controls.phone.valueChanges)
   *     .pipe(takeUntilDestroyed(this.destroyRef))
   *     .subscribe(customer => { ... });
   */
  bindTo(
    phoneValueChanges: Observable<string>,
    options: { debounceMs?: number; minLength?: number } = {},
  ): Observable<CustomerLookupResponse | null> {
    const { debounceMs = 300, minLength = 7 } = options;

    return phoneValueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(debounceMs),
      distinctUntilChanged(),
      filter((value) => value.length >= minLength),
      switchMap((phone) =>
        this.orderApi.lookupCustomer(phone).pipe(catchError(() => of(null))),
      ),
    );
  }
}
