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

export interface ActiveToast {
  id: number;
  type: "SUCCESS" | "ERROR" | "INFO" | "WARNING";
  message: string;
  duration: number;
  remainingTime: number;
  progress: number;
  isHovered: boolean;
  intervalId?: any;
}

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("toastAnimation", [
      state("void", style({ transform: "translateY(-20px) scale(0.95)", opacity: 0 })),
      state("*", style({ transform: "translateY(0) scale(1)", opacity: 1 })),
      transition("void => *", animate("300ms cubic-bezier(0.34, 1.56, 0.64, 1)")),
      transition(
        "* => void",
        animate(
          "200ms ease-in",
          style({ opacity: 0, transform: "translateY(-15px) scale(0.95)" }),
        ),
      ),
    ]),
  ],
  template: `
    <div
      class="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] sm:w-auto min-w-[320px] max-w-md"
    >
      @for (toast of toasts; track toast.id) {
        <div
          @toastAnimation
          (mouseenter)="pause(toast)"
          (mouseleave)="resume(toast)"
          class="pointer-events-auto relative overflow-hidden w-full bg-ds-bg text-ds-text px-4 py-3.5 shadow-xl flex items-center justify-between gap-4 rounded-xl border transition-all duration-300"
          [ngClass]="{
            'border-ds-success/30 shadow-ds-success/5': toast.type === 'SUCCESS',
            'border-ds-danger/30 shadow-ds-danger/5': toast.type === 'ERROR',
            'border-ds-warning/30 shadow-ds-warning/5': toast.type === 'WARNING',
            'border-ds-info/30 shadow-ds-info/5': toast.type === 'INFO',
            'border-ds-border': !toast.type
          }"
        >
          <div class="flex items-center gap-3 pr-2">
             @if (toast.type === 'SUCCESS') {
                <div class="size-8 rounded-full bg-ds-success flex items-center justify-center text-white shrink-0 shadow-lg shadow-ds-success/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                </div>
             } @else if (toast.type === 'ERROR') {
                <div class="size-8 rounded-full bg-ds-danger flex items-center justify-center text-white shrink-0 shadow-lg shadow-ds-danger/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
             } @else if (toast.type === 'WARNING') {
                <div class="size-8 rounded-full bg-ds-warning flex items-center justify-center text-white shrink-0 shadow-lg shadow-ds-warning/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
             } @else if (toast.type === 'INFO') {
                <div class="size-8 rounded-full bg-ds-info flex items-center justify-center text-white shrink-0 shadow-lg shadow-ds-info/20">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
             }
             <div class="flex flex-col min-w-0">
               <span class="text-sm font-semibold leading-tight">{{ toast.message }}</span>
             </div>
          </div>
          <button
            (click)="remove(toast.id); $event.stopPropagation();"
            class="size-8 flex items-center justify-center rounded-full hover:bg-ds-surface text-ds-text-muted hover:text-ds-text transition-all shrink-0 z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>

          <!-- Smooth animated progress bar -->
          <div
            class="absolute bottom-0 left-0 h-1 transition-all ease-linear duration-[20ms]"
            [ngClass]="{
              'bg-ds-success': toast.type === 'SUCCESS',
              'bg-ds-danger': toast.type === 'ERROR',
              'bg-ds-warning': toast.type === 'WARNING',
              'bg-ds-info': toast.type === 'INFO'
            }"
            [style.width.%]="toast.progress"
          ></div>
        </div>
      }
    </div>
  `,
})
export class ToastComponent implements OnInit, OnDestroy {
  notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  toasts: ActiveToast[] = [];

  ngOnInit() {
    this.notificationService.toast$.subscribe((toast) => {
      if (toast) {
        this.add(toast);
      }
    });
  }

  ngOnDestroy(): void {
    this.toasts.forEach((t) => {
      if (t.intervalId) {
        clearInterval(t.intervalId);
      }
    });
  }

  add(toastMsg: ToastMessage) {
    // Limit to max 5 simultaneous toasts, dismissing the oldest
    if (this.toasts.length >= 5) {
      const oldest = this.toasts[0];
      this.remove(oldest.id);
    }

    const duration = 4000; // 4 seconds configurable duration
    const activeToast: ActiveToast = {
      id: toastMsg.id,
      type: toastMsg.type,
      message: toastMsg.message,
      duration,
      remainingTime: duration,
      progress: 100,
      isHovered: false,
    };

    this.toasts.push(activeToast);
    this.startTimer(activeToast);
    this.cdr.markForCheck();
  }

  startTimer(toast: ActiveToast) {
    const tickInterval = 20; // tick every 20ms for super-smooth countdown
    toast.intervalId = setInterval(() => {
      if (!toast.isHovered) {
        toast.remainingTime -= tickInterval;
        toast.progress = Math.max(0, (toast.remainingTime / toast.duration) * 100);
        if (toast.remainingTime <= 0) {
          clearInterval(toast.intervalId);
          this.remove(toast.id);
        }
        this.cdr.markForCheck();
      }
    }, tickInterval);
  }

  pause(toast: ActiveToast) {
    toast.isHovered = true;
  }

  resume(toast: ActiveToast) {
    toast.isHovered = false;
  }

  remove(id: number) {
    const toast = this.toasts.find((t) => t.id === id);
    if (toast && toast.intervalId) {
      clearInterval(toast.intervalId);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.cdr.markForCheck();
  }
}
