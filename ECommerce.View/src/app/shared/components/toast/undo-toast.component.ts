import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import {
  NotificationService,
  UndoToastMessage,
} from "../../../core/services/notification.service";
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";

interface ActiveUndoToast {
  id: number;
  message: string;
  duration: number;
  remainingTime: number;
  progress: number;
  isHovered: boolean;
  undoCallback: () => void;
  intervalId?: any;
}

@Component({
  selector: "app-undo-toast",
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("undoToastAnimation", [
      state("void", style({ transform: "translateY(20px) scale(0.95)", opacity: 0 })),
      state("*", style({ transform: "translateY(0) scale(1)", opacity: 1 })),
      transition("void => *", animate("300ms cubic-bezier(0.34, 1.56, 0.64, 1)")),
      transition(
        "* => void",
        animate(
          "200ms ease-in",
          style({ opacity: 0, transform: "translateY(10px) scale(0.95)" }),
        ),
      ),
    ]),
  ],
  template: `
    <div
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] sm:w-auto min-w-[320px] max-w-md"
      aria-live="polite"
    >
      @for (toast of toasts; track toast.id) {
        <div
          @undoToastAnimation
          (mouseenter)="pause(toast)"
          (mouseleave)="resume(toast)"
          class="pointer-events-auto relative overflow-hidden w-full bg-ds-bg text-ds-text px-4 py-3.5 shadow-xl flex items-center justify-between gap-4 rounded-xl border border-ds-border"
        >
          <div class="flex items-center gap-3">
            <div class="size-8 rounded-full bg-ds-surface flex items-center justify-center text-ds-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </div>
            <span class="text-sm font-semibold leading-tight">{{ toast.message }}</span>
          </div>
          <button
            (click)="undo(toast); $event.stopPropagation();"
            class="text-sm font-bold text-ds-primary hover:text-ds-primary-hover transition-colors shrink-0 px-3 py-1.5 rounded-lg hover:bg-ds-primary/5"
          >
            Undo
          </button>

          <!-- Smooth animated progress bar -->
          <div
            class="absolute bottom-0 left-0 h-1 bg-ds-text-muted/30 transition-all ease-linear duration-[20ms]"
            [style.width.%]="toast.progress"
          ></div>
        </div>
      }
    </div>
  `,
})
export class UndoToastComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  toasts: ActiveUndoToast[] = [];

  ngOnInit() {
    this.notificationService.undoToast$.subscribe((toast) => {
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

  add(toastMsg: UndoToastMessage) {
    // Only show one undo toast at a time
    if (this.toasts.length > 0) {
      this.remove(this.toasts[0].id);
    }

    const activeToast: ActiveUndoToast = {
      id: toastMsg.id,
      message: toastMsg.message,
      duration: toastMsg.duration,
      remainingTime: toastMsg.duration,
      progress: 100,
      isHovered: false,
      undoCallback: toastMsg.undoCallback,
    };

    this.toasts.push(activeToast);
    this.startTimer(activeToast);
    this.cdr.markForCheck();
  }

  startTimer(toast: ActiveUndoToast) {
    const tickInterval = 20;
    toast.intervalId = setInterval(() => {
      if (!toast.isHovered) {
        toast.remainingTime -= tickInterval;
        toast.progress = Math.max(
          0,
          (toast.remainingTime / toast.duration) * 100,
        );
        if (toast.remainingTime <= 0) {
          clearInterval(toast.intervalId);
          this.remove(toast.id);
        }
        this.cdr.markForCheck();
      }
    }, tickInterval);
  }

  undo(toast: ActiveUndoToast) {
    toast.undoCallback();
    this.remove(toast.id);
  }

  pause(toast: ActiveUndoToast) {
    toast.isHovered = true;
  }

  resume(toast: ActiveUndoToast) {
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
