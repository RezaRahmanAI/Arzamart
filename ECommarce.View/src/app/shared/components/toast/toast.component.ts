import { Component, OnInit, inject, ChangeDetectionStrategy } from "@angular/core";
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
import { AppIconComponent } from "../app-icon/app-icon.component";

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [NgClass, AppIconComponent],
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
          class="pointer-events-auto w-full bg-white text-gray-900 px-4 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-4 rounded-xl border border-gray-100"
        >
          <div class="flex items-center gap-3">
             @if (toast.type === 'SUCCESS') {
                <div class="size-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/20">
                   <app-icon name="Check" size="18"></app-icon>
                </div>
             } @else if (toast.type === 'ERROR') {
                <div class="size-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
                   <app-icon name="AlertCircle" size="18"></app-icon>
                </div>
             }
             <div class="flex flex-col min-w-0">
               <span class="text-sm font-semibold leading-tight">{{ toast.message }}</span>
             </div>
          </div>
          <button
            (click)="remove(toast.id)"
            class="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
          >
            <app-icon name="X" size="14"></app-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent implements OnInit {
  notificationService = inject(NotificationService);
  toasts: ToastMessage[] = [];

  ngOnInit() {
    this.notificationService.toast$.subscribe((toast) => {
      if (toast) {
        this.add(toast);
      }
    });
  }

  add(toast: ToastMessage) {
    this.toasts.push(toast);
    setTimeout(() => this.remove(toast.id), 3000); // Auto remove after 3s
  }

  remove(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
