import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { NgClass } from "@angular/common";
import {
  NotificationService,
  ToastMessage,
} from "../../../core/services/notification.service";
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";


@Component({
  selector: "app-toast",
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("toastAnimation", [
      state("void", style({ transform: "translateY(-20px)", opacity: 0 })),
      state("*", style({ transform: "translateY(0)", opacity: 1 })),
      transition("void => *", animate("400ms cubic-bezier(0.2, 0.8, 0.2, 1)")),
      transition(
        "* => void",
        animate(
          "300ms ease-in",
          style({ opacity: 0, transform: "translateY(-10px)" }),
        ),
      ),
    ]),
  ],
  template: `
    <div
      class="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] sm:w-auto min-w-[320px] max-w-md"
    >
      @for (toast of toasts; track toast.id) {
        <div
          @toastAnimation
          class="pointer-events-auto w-full bg-ds-bg text-ds-text px-4 py-3.5 shadow-lg flex items-center justify-between gap-4 rounded-xl border border-ds-border"
        >
          <div class="flex items-center gap-3">
             @if (toast.type === 'SUCCESS') {
                <div class="size-8 rounded-full bg-ds-success flex items-center justify-center text-white shrink-0 shadow-lg shadow-ds-success/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                </div>
             } @else if (toast.type === 'ERROR') {
                <div class="size-8 rounded-full bg-ds-danger flex items-center justify-center text-white shrink-0 shadow-lg shadow-ds-danger/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
             }
             <div class="flex flex-col min-w-0">
               <span class="text-sm font-semibold leading-tight">{{ toast.message }}</span>
             </div>
          </div>
          <button
            (click)="remove(toast.id)"
            class="size-8 flex items-center justify-center rounded-full hover:bg-ds-surface text-ds-text-muted hover:text-ds-text transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent implements OnInit, OnDestroy {
  notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  toasts: ToastMessage[] = [];
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.notificationService.toast$.subscribe((toast) => {
      if (toast) {
        this.add(toast);
      }
    });
  }

  ngOnDestroy(): void {
    this.timeoutIds.forEach(clearTimeout);
    this.timeoutIds = [];
  }

  add(toast: ToastMessage) {
    this.toasts.push(toast);
    this.cdr.markForCheck();
    const id = setTimeout(() => this.remove(toast.id), 3000);
    this.timeoutIds.push(id);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
