import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class SidebarService {
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  constructor() {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      this._isOpen.set(true);
    }
  }

  toggle(): void {
    this._isOpen.update((open) => !open);
  }

  close(): void {
    this._isOpen.set(false);
  }

  open(): void {
    this._isOpen.set(true);
  }
}
